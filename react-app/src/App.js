import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ChatBox from './components/ChatBox';

const App = () => {
  const [darkMode, setDarkMode] = useState(false);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  useEffect(() => {
    document.body.className = darkMode ? 'dark-mode' : 'light-mode';
  }, [darkMode]);

  return (
    <div className={`app ${darkMode ? 'dark' : 'light'}`}>
      <header>
        <button onClick={toggleDarkMode} className="mode-toggle">
          {darkMode ? 'Light Mode' : 'Dark Mode'}
        </button>
        <button className="new-chat">+</button>
      </header>
      <ChatBox />
    </div>
  );
};

export default App;
