import React, { useState } from 'react';
import axios from 'axios';
import './LevelSelection.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const levels = [
  { code: 'A1', name: 'Začátečník', description: 'Základní fráze a slovní zásoba' },
  { code: 'A2', name: 'Mírně pokročilý', description: 'Jednoduché konverzace' },
  { code: 'B1', name: 'Středně pokročilý', description: 'Běžné situace a témata' },
  { code: 'B2', name: 'Pokročilý', description: 'Složitější diskuze' },
  { code: 'C1', name: 'Velmi pokročilý', description: 'Plynulá komunikace' },
  { code: 'C2', name: 'Mistrovská úroveň', description: 'Téměř rodilý mluvčí' }
];

const scenarios = [
  { id: 'airport', name: '✈️ Letiště', description: 'Odbavení, bezpečnostní kontrola, boarding', icon: '✈️' },
  { id: 'restaurant', name: '🍽️ Restaurace', description: 'Objednávání jídla, platba, stížnosti', icon: '🍽️' },
  { id: 'hotel', name: '🏨 Hotel', description: 'Check-in, rezervace, problémy s pokojem', icon: '🏨' },
  { id: 'cafe', name: '☕ Kavárna', description: 'Objednávka nápojů, casual konverzace', icon: '☕' },
  { id: 'shop', name: '🛍️ Obchod', description: 'Nakupování, vracení zboží, velikosti', icon: '🛍️' },
  { id: 'doctor', name: '🏥 U lékaře', description: 'Popis příznaků, lékařské termíny', icon: '🏥' },
  { id: 'job-interview', name: '💼 Pracovní pohovor', description: 'Prezentace dovedností, otázky o zkušenostech', icon: '💼' },
  { id: 'bank', name: '🏦 Banka', description: 'Otevření účtu, dotazy na služby', icon: '🏦' },
  { id: 'random', name: '🎲 Náhodný scénář', description: 'AI vybere situaci za tebe', icon: '🎲' }
];

function LevelSelection({ onStart, username }) {
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [selectedScenario, setSelectedScenario] = useState(null);
  const [correctImmediately, setCorrectImmediately] = useState(false);
  const [conversationMode, setConversationMode] = useState('voice'); // ✅ 'voice' nebo 'text'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleStart = async () => {
    if (!selectedLevel) return setError('Prosím vyberte úroveň');
    if (!selectedScenario) return setError('Prosím vyberte scénář');

    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(`${API_URL}/api/session/start`, {
        level: selectedLevel,
        scenario: selectedScenario,
        username: username
      });

      // ✅ předáme i vybraný režim (text/voice)
      onStart(
        response.data.sessionId,
        selectedLevel,
        correctImmediately,
        selectedScenario,
        conversationMode
      );
    } catch (err) {
      setError('Nepodařilo se spustit lekci. Zkuste to znovu.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="level-selection">
      <h2>Vyberte svou úroveň angličtiny</h2>

      <div className="levels-grid">
        {levels.map(level => (
          <div
            key={level.code}
            className={`level-card ${selectedLevel === level.code ? 'selected' : ''}`}
            onClick={() => setSelectedLevel(level.code)}
          >
            <h3>{level.code}</h3>
            <h4>{level.name}</h4>
            <p>{level.description}</p>
          </div>
        ))}
      </div>

      <div className="scenario-selection">
        <h3>Vyberte scénář konverzace</h3>
        <div className="scenarios-grid">
          {scenarios.map(scenario => (
            <div
              key={scenario.id}
              className={`scenario-card ${selectedScenario === scenario.id ? 'selected' : ''}`}
              onClick={() => setSelectedScenario(scenario.id)}
            >
              <div className="scenario-icon">{scenario.icon}</div>
              <h4>{scenario.name}</h4>
              <p>{scenario.description}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="conversation-mode-selection">
        <h3>Režim konverzace</h3>
        <div className="mode-options">
          <label className={`mode-option ${conversationMode === 'text' ? 'selected' : ''}`}>
            <input
              type="radio"
              name="mode"
              checked={conversationMode === 'text'}
              onChange={() => setConversationMode('text')}
            />
            <div className="option-content">
              <strong>💬 Pouze textová</strong>
              <p>Psaná konverzace bez mikrofonu a zvuku</p>
            </div>
          </label>

          <label className={`mode-option ${conversationMode === 'voice' ? 'selected' : ''}`}>
            <input
              type="radio"
              name="mode"
              checked={conversationMode === 'voice'}
              onChange={() => setConversationMode('voice')}
            />
            <div className="option-content">
              <strong>🎙️ Hlasová konverzace</strong>
              <p>AI s tebou bude mluvit a poslouchat tě</p>
            </div>
          </label>
        </div>
      </div>

      <div className="correction-settings">
        <h3>Opravy chyb</h3>
        <div className="correction-options">
          <label className={`correction-option ${!correctImmediately ? 'selected' : ''}`}>
            <input
              type="radio"
              name="correction"
              checked={!correctImmediately}
              onChange={() => setCorrectImmediately(false)}
            />
            <div className="option-content">
              <strong>📋 Na konci lekce</strong>
              <p>AI ti ukáže všechny chyby až po skončení konverzace</p>
            </div>
          </label>

          <label className={`correction-option ${correctImmediately ? 'selected' : ''}`}>
            <input
              type="radio"
              name="correction"
              checked={correctImmediately}
              onChange={() => setCorrectImmediately(true)}
            />
            <div className="option-content">
              <strong>⚡ Okamžitě</strong>
              <p>AI tě jemně opraví přímo během konverzace</p>
            </div>
          </label>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <button
        className="start-button"
        onClick={handleStart}
        disabled={loading || !selectedLevel || !selectedScenario}
      >
        {loading ? 'Spouštím...' : 'Začít lekci'}
      </button>
    </div>
  );
}

export default LevelSelection;
