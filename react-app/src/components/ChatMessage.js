import React from 'react';

const ChatMessage = ({ message, sender }) => {
  return (
    <div className={`chat-message ${sender === 'Human' ? 'human' : 'ai'}`}>
      <p style={{ whiteSpace: 'pre-wrap' }}>{message}</p>
    </div>
  );
};

export default ChatMessage;
