import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './MistakesSummary.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

function MistakesSummary({ sessionId, onClose }) {
  const [mistakes, setMistakes] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMistakes();
  }, []);

  const loadMistakes = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/session/${sessionId}/mistakes`);
      setMistakes(response.data);
    } catch (err) {
      console.error('Chyba při načítání chyb:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="mistakes-summary">Načítám shrnutí...</div>;
  }

  const mistakeTypeNames = {
    grammar: '📚 Gramatika',
    spelling: '✍️ Pravopis',
    'word-order': '🔄 Slovosled',
    vocabulary: '📖 Slovní zásoba'
  };

  return (
    <div className="mistakes-summary">
      <h2>📊 Shrnutí lekce</h2>
      
      {mistakes && mistakes.totalMistakes > 0 ? (
        <>
          <div className="summary-stats">
            <div className="stat-card">
              <h3>{mistakes.totalMistakes}</h3>
              <p>Celkem chyb</p>
            </div>
          </div>

          <div className="mistakes-by-type">
            <h3>Chyby podle typu</h3>
            {Object.keys(mistakeTypeNames).map(type => {
              const typeMistakes = mistakes.mistakesByType[type];
              if (!typeMistakes || typeMistakes.length === 0) return null;

              return (
                <div key={type} className="mistake-type-section">
                  <h4>{mistakeTypeNames[type]} ({typeMistakes.length})</h4>
                  {typeMistakes.map((mistake, index) => (
                    <div key={index} className="mistake-item">
                      <div className="mistake-original">
                        ❌ <strong>Chyba:</strong> {mistake.original}
                      </div>
                      <div className="mistake-corrected">
                        ✅ <strong>Správně:</strong> {mistake.corrected}
                      </div>
                      <div className="mistake-explanation">
                        💡 {mistake.explanation}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <div className="no-mistakes">
          <h3>🎉 Skvělá práce!</h3>
          <p>Neudělal jste žádné chyby v této lekci.</p>
        </div>
      )}

      <button className="close-button" onClick={onClose}>
        Zpět na výběr úrovně
      </button>
    </div>
  );
}

export default MistakesSummary;