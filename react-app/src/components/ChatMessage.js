import React from 'react';

const ChatMessage = ({ message, sender }) => {
  return (
    <div className={`chat-message ${sender}`}>
      <p>{sender}: {message}</p>
    </div>
  );
};

export default ChatMessage;
