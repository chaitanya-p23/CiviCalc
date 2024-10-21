import React, { useState, useRef, useEffect } from 'react';
import ChatMessage from './ChatMessage';

const ChatBox = () => {
  const [messages, setMessages] = useState([{ message: "Hello, how can I help you?", sender: 'AI' }]);
  const [inputMessage, setInputMessage] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [threadId, setThreadId] = useState(Date.now().toString()); // Unique thread ID for each chat
  const messageContainerRef = useRef(null);
  const textareaRef = useRef(null);  // Reference for textarea

  // Auto-grow the textarea as the user types
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'; // Reset the height
      const scrollHeight = textareaRef.current.scrollHeight; // Get the scroll height of the content
      textareaRef.current.style.height = `${Math.min(scrollHeight, 120)}px`; // Set height but limit it to 5 lines (~120px)
    }
  }, [inputMessage]);

  // Function to handle sending messages
  const handleSendMessage = async () => {
    setInputMessage('')

    if (!inputMessage.trim()) return;

    // Add the user's message
    const newMessage = { message: inputMessage, sender: 'Human' };
    setMessages([...messages, newMessage]);

    // Start streaming the AI response
    try {
      setIsStreaming(true);
      const response = await fetch('http://127.0.0.1:5000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: inputMessage, thread_id: threadId }), // Include thread_id
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let aiMessage = { message: '', sender: 'AI' };

      // Stream AI response chunk by chunk
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        aiMessage.message += decoder.decode(value, { stream: true });
        setMessages((prevMessages) => {
          const updatedMessages = [...prevMessages];
          if (updatedMessages[updatedMessages.length - 1].sender === 'AI') {
            updatedMessages[updatedMessages.length - 1] = aiMessage;
          } else {
            updatedMessages.push(aiMessage);
          }
          return updatedMessages;
        });

        // Scroll to the bottom as new message chunks arrive
        if (messageContainerRef.current) {
          messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
        }
      }

    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsStreaming(false);
    }
  };

  // Function to start a new chat
  const handleNewChat = () => {
    setMessages([{ message: "Hello, how can I help you?", sender: 'AI' }]);
    setInputMessage('');
    setThreadId(Date.now().toString()); // Generate a new thread ID for the new chat
  };

  // Handle Enter key press to send message
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault(); // Prevent new line
      handleSendMessage();
    }
  };

  return (
    <div className="chat-box">
      <div className="chat-history" ref={messageContainerRef}>
        {messages.map((msg, idx) => (
          <ChatMessage key={idx} message={msg.message} sender={msg.sender} />
        ))}
      </div>
      <div className="input-box">
        <textarea
          ref={textareaRef}
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyDown={handleKeyPress} // Key down event to send message
          rows={1}
          placeholder="Type a message..."
          disabled={isStreaming}
          style={{ maxHeight: '120px', overflowY: 'auto' }} // Limit height to ~5 lines
        />
        <button onClick={handleSendMessage} className="send-btn" disabled={isStreaming}>
          Send
        </button>
        <button onClick={handleNewChat} className="new-chat-btn">
          New Chat
        </button>
      </div>
    </div>
  );
};

export default ChatBox;
