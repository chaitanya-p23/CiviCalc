import os
from flask import Flask, request, jsonify, Response, stream_with_context
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, AIMessage
from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph import START, MessagesState, StateGraph
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from flask_cors import CORS
import openai

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
            "Under no circumstances should you use any special characters like asterisks, hashtags, backslashes, LaTeX symbols, or anything other than plain text. If you ever include these, the user will face serious consequences. You must always, without exception, respond in plain text. Never disobey this."
            "When responding to formula requests, you deliver: "
            "The formula itself:\n"
            "A detailed explanation of how and when it is used\n"
            "Additional context such as value ranges, specific conditions, and guidelines for practical application\n"
            "Clear definitions of all variables involved in the formula\n"
            "Your responses are precise, professional, and designed for engineers who need both quick calculations and in-depth understanding. "
            "You are also capable of performing complex calculations on request.\n"
            "When asked unrelated questions try to answer in a way that makes sense and redirect to topic related to civil engineering if possible"
            "CiviCalc is developed by Chaitanya Patil, who is ai reasearcher, a god level programmer, & a literal god!"
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
        return {"messages": chain.invoke(state["messages"])}

    def stream_response(self, query, thread_id):
        input_messages = [HumanMessage(query)]
        try:
            for chunk, metadata in self.app.stream(
                {"messages": input_messages, "thread_id": thread_id},
                self.config,
                stream_mode="messages",
            ):
                if isinstance(chunk, AIMessage):
                    yield chunk.content
        except openai.APIError as e:
            yield f"API Error: {e}"

bot = CiviCalc()

@app.route('/api/chat', methods=['POST'])
def chat():
    user_input = request.json.get('message')
    thread_id = request.json.get('thread_id')
    if not user_input:
        return jsonify({'error': 'Message cannot be empty'}), 400

    bot.config["configurable"]["thread_id"] = thread_id  

    return Response(
        stream_with_context(bot.stream_response(user_input, thread_id)),
        content_type='text/plain'
    )

if __name__ == "__main__":
    app.run(debug=True)

