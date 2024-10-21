import React, { useState, useRef } from 'react';
import ChatMessage from './ChatMessage';

const ChatBox = () => {
  const [messages, setMessages] = useState([{ message: "Hello, how can I help you?", sender: 'AI' }]);
  const [inputMessage, setInputMessage] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const messageContainerRef = useRef(null);

  const handleSendMessage = async () => {
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
        body: JSON.stringify({ message: inputMessage }),
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

    setInputMessage('');
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
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          rows={1}
          placeholder="Type a message..."
          disabled={isStreaming}  // Disable input while streaming
        />
        <button onClick={handleSendMessage} className="send-btn" disabled={isStreaming}>
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatBox;
