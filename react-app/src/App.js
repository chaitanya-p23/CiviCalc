import React, { useState, useEffect } from 'react';
import ChatBox from './components/ChatBox';
import './index.css'; // Importing the new styles

const App = () => {
  const [darkMode, setDarkMode] = useState(false);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  useEffect(() => {
    document.body.className = darkMode ? 'dark-mode' : 'light-mode';
  }, [darkMode]);

  return (
    <div className={`app-container ${darkMode ? 'dark' : 'light'}`}>
      <header className="app-header">
        <div className="header-buttons">
          <button onClick={toggleDarkMode} className="mode-toggle">
            {darkMode ? 'Light Mode' : 'Dark Mode'}
          </button>
        </div>
      </header>
      <ChatBox />
    </div>
  );
};

export default App;
