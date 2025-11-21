import React, { useState } from 'react';
import './App.css';
import LevelSelection from './components/LevelSelection';
import ChatInterface from './components/ChatInterface';
import UserProfile from './components/UserProfile';

function App() {
  const [sessionId, setSessionId] = useState(null);
  const [level, setLevel] = useState(null);
  const [correctImmediately, setCorrectImmediately] = useState(false);
  const [conversationMode, setConversationMode] = useState('voice'); // ✅ nový stav
  const [currentView, setCurrentView] = useState('home'); // home, profile, lesson

  const username = 'guest'; // FIXNÍ UŽIVATEL

  // ✅ přijímá i "mode" jako 5. argument
  const handleStartSession = (newSessionId, selectedLevel, correctionMode, scenario, mode) => {
    setSessionId(newSessionId);
    setLevel(selectedLevel);
    setCorrectImmediately(correctionMode);
    setConversationMode(mode); // uložíme voice/text
    setCurrentView('lesson');
  };

  const handleEndSession = () => {
    setSessionId(null);
    setLevel(null);
    setCorrectImmediately(false);
    setConversationMode('voice');
    setCurrentView('home');
  };

  const handleViewProfile = () => setCurrentView('profile');
  const handleBackHome = () => setCurrentView('home');

  return (
    <div className="App">
      <header className="App-header">
        <div className="header-content">
          <div className="header-left">
            <h1>🎓 English Tutor AI</h1>
            <p>Učte se anglicky s AI lektorem</p>
          </div>
          <div className="header-right">
            {currentView !== 'profile' && currentView !== 'lesson' && (
              <button className="profile-button" onClick={handleViewProfile}>
                👤 Můj profil
              </button>
            )}
            {currentView !== 'home' && currentView !== 'lesson' && (
              <button className="home-button" onClick={handleBackHome}>
                🏠 Domů
              </button>
            )}
          </div>
        </div>
      </header>
      
      <main className="App-main">
        {currentView === 'home' && !sessionId && (
          <LevelSelection onStart={handleStartSession} username={username} />
        )}
        
        {currentView === 'lesson' && sessionId && (
          <ChatInterface 
            sessionId={sessionId} 
            level={level}
            correctImmediately={correctImmediately}
            onEnd={handleEndSession}
            mode={conversationMode} // ✅ předáváme do ChatInterface
          />
        )}
        
        {currentView === 'profile' && (
          <UserProfile username={username} onBack={handleBackHome} />
        )}
      </main>
    </div>
  );
}

export default App;
