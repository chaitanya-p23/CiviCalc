import os
from flask import Flask, request, jsonify, Response, stream_with_context
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, AIMessage
from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph import START, MessagesState, StateGraph
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from flask_cors import CORS

load_dotenv()

app = Flask(__name__)
CORS(app)

class CiviCalc:
    def __init__(self):
        self.llm = self._initialize_llm()
        self.prompt = self._create_prompt_template()
        self.workflow = self._setup_workflow()
        self.memory = MemorySaver()
        self.app = self.workflow.compile(checkpointer=self.memory)
        self.config = {"configurable": {"thread_id": "default123"}}

    def _initialize_llm(self):
        return ChatOpenAI(
            api_key=os.getenv("LANGCHAIN_API_KEY"), 
            base_url="https://openrouter.ai/api/v1", 
            model="liquid/lfm-40b:free"
        )

    def _create_prompt_template(self):
        context = (
            "You are CiviCalc, a specialized chatbot focused on providing civil engineering formulae and explanations. "
            "When responding to formula requests, you deliver: "
            "The formula itself:\n"
            "A detailed explanation of how and when it is used\n"
            "Additional context such as value ranges, specific conditions, and guidelines for practical application\n"
            "Clear definitions of all variables involved in the formula\n"
            "Your responses are precise, professional, and designed for engineers who need both quick calculations and in-depth understanding. "
            "You are also capable of performing complex calculations on request."
        )
        return ChatPromptTemplate.from_messages(
            [
                ("system", context),
                MessagesPlaceholder(variable_name="messages"),
            ]
        )

    def _setup_workflow(self):
        workflow = StateGraph(state_schema=MessagesState)
        workflow.add_edge(START, "model")
        workflow.add_node("model", self._call_model)
        return workflow

    def _call_model(self, state: MessagesState):
        chain = self.prompt | self.llm
        response = chain.invoke(state["messages"])
        return {"messages": response}

    def stream_response(self, query, thread_id):
        # We can keep track of the thread_id if needed (e.g., for logging)
        input_messages = [HumanMessage(query)]
        for chunk, metadata in self.app.stream(
            {"messages": input_messages, "thread_id": thread_id},  # Pass thread_id here if needed
            self.config,
            stream_mode="messages",
        ):
            if isinstance(chunk, AIMessage):
                yield chunk.content

bot = CiviCalc()

@app.route('/api/chat', methods=['POST'])
def chat():
    user_input = request.json.get('message')
    thread_id = request.json.get('thread_id')  # Get thread_id from the request
    if not user_input:
        return jsonify({'error': 'Message cannot be empty'}), 400

    # Update the configuration to use the thread_id dynamically
    bot.config["configurable"]["thread_id"] = thread_id  

    return Response(
        stream_with_context(bot.stream_response(user_input, thread_id)),
        content_type='text/plain'
    )

if __name__ == "__main__":
    app.run(debug=True)
