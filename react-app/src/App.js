import React, { useState, useRef, useEffect } from 'react';
import { Moon, Sun, PlusSquare, Send } from 'lucide-react';
import './App.css';

const App = () => {
  const [isDarkMode, setIsDarkMode] = useState((window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches));
  const [messages, setMessages] = useState([]); // No initial messages
  const [input, setInput] = useState('');
  const [isResponding, setIsResponding] = useState(false);
  const [threadId, setThreadId] = useState(Date.now().toString());
  const inputRef = useRef(null);
  const mainContentRef = useRef(null);
  const hasInitialized = useRef(false); // Ref to track if the chat has been initialized

  useEffect(() => {
    const initializeChat = async () => {
        if (hasInitialized.current) return; // Guard to prevent multiple requests
    
        hasInitialized.current = true; // Mark the initialization as complete
    
        try {
          const response = await fetch('http://127.0.0.1:5000/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: 'Hello', thread_id: threadId }),
          });
    
          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let aiMessage = { role: 'assistant', content: '' };
    
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
    
            aiMessage.content += decoder.decode(value, { stream: true });
            setMessages((prevMessages) => {
              const updatedMessages = [...prevMessages];
              if (updatedMessages.length === 0 || updatedMessages[updatedMessages.length - 1].role !== 'assistant') {
                updatedMessages.push(aiMessage);
              } else {
                updatedMessages[updatedMessages.length - 1] = aiMessage;
              }
              return updatedMessages;
            });
          }
        } catch (error) {
          console.error('Error initializing chat:', error);
        }
      };
      initializeChat();
  }, [threadId]); // Ensure this only runs once for the current thread

  useEffect(() => {
    inputRef.current?.focus(); // Auto-focus on the text input after each response
  }, [messages]); // Focus when messages change

  const scrollToBottom = (behavior = 'smooth') => {
    if (mainContentRef.current) {
      mainContentRef.current.scrollTo({
        top: mainContentRef.current.scrollHeight,
        behavior,
      });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    inputRef.current.style.height = '51px';
  
    const userMessage = input.trim();
    setInput('');
  
    setMessages((prevMessages) => [
      ...prevMessages, 
      { role: 'user', content: userMessage }
    ]);
  
    setIsResponding(true);
  
    try {
      const response = await fetch('http://127.0.0.1:5000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage, thread_id: threadId }),
      });
  
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let aiMessage = { role: 'assistant', content: '' };
  
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
  
        aiMessage.content += decoder.decode(value, { stream: true });
        setMessages((prevMessages) => {
          const updatedMessages = [...prevMessages];
          if (updatedMessages[updatedMessages.length - 1].role === 'assistant') {
            updatedMessages[updatedMessages.length - 1] = aiMessage;
          } else {
            updatedMessages.push(aiMessage);
          }
          return updatedMessages;
        });
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsResponding(false);
      setTimeout(() => inputRef.current.focus(), 0);
    }
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (!input.trim() || isResponding) return;
    handleSendMessage();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setInput('');
    setThreadId(Date.now().toString());
    hasInitialized.current = false; // Reset the initialization for the new chat
  };

  const adjustTextareaHeight = (e) => {
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 160) + 'px';
  };

  return (
    <div className={`chat-container ${isDarkMode ? 'dark' : 'light'}`}>
      <header className="header">
        <div className="header-content">
          <h1 className="title">Civi<span className='blue'>Calc</span></h1>
          <div className="button-container">
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="icon-button"
              aria-label="Toggle dark mode"
            >
              {isDarkMode ? <Sun size={24} /> : <Moon size={24} />}
            </button>
            <button 
              onClick={handleNewChat}
              className="icon-button"
              aria-label="Start new chat"
            >
              <PlusSquare size={24} />
            </button>
          </div>
        </div>
      </header>

      <main ref={mainContentRef} className="main-content">
        <div className="messages-container">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`message-wrapper ${message.role}`}
            >
              <div className={`message ${message.role}`}>
                {message.content}
              </div>
            </div>
          ))}
        </div>
      </main>

      <footer className="footer">
        <div className="input-form-container">
          <form onSubmit={handleSubmit} className="input-form">
            <div className="textarea-wrapper">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  adjustTextareaHeight(e);
                }}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                className="input-textarea"
                style={{ height: '51px' }}
                rows={1}
                disabled={isResponding}
              />
              <button
                type="submit"
                disabled={!input.trim() || isResponding}
                className="send-button"
                aria-label="Send message"
              >
                <Send size={20} />
              </button>
            </div>
          </form>
        </div>
      </footer>
    </div>
  );
};

export default App;

