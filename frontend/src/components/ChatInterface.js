import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './ChatInterface.css';
import MistakesSummary from './MistakesSummary';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

function ChatInterface({ sessionId, level, correctImmediately, onEnd, mode }) {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [autoPlay, setAutoPlay] = useState(mode === 'voice');
  const [autoSend, setAutoSend] = useState(mode === 'voice');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [lessonStarted, setLessonStarted] = useState(false);
  const [expandedMistakes, setExpandedMistakes] = useState({});
  const [stats, setStats] = useState({ messages: 0, mistakes: 0 });
  const [toastMessage, setToastMessage] = useState(null);
  const [wordTranslations, setWordTranslations] = useState({});
  const [sentenceTranslations, setSentenceTranslations] = useState({});
  const [importantWords, setImportantWords] = useState({});

  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const audioRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis);

  // --- NOVÉ: delay a timeout handling ---
  const SEND_DELAY_MS = 4000; // <-- Prodlouženo na 4 sekundy pro čas na přemýšlení
  const sendTimeoutRef = useRef(null);
  const autoSendRef = useRef(autoSend);

  useEffect(() => { autoSendRef.current = autoSend; }, [autoSend]);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  useEffect(scrollToBottom, [messages]);

  // Progress stats
  useEffect(() => {
    const userMessages = messages.filter(m => m.role === 'user').length;
    const totalMistakes = messages.reduce((sum, m) => sum + (m.mistakes?.length || 0), 0);
    setStats({ messages: userMessages, mistakes: totalMistakes });
  }, [messages]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Ctrl/Cmd + Enter pro odeslání
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (inputMessage.trim() && !loading && lessonStarted) {
          handleSendMessage(inputMessage);
        }
      }
      // Escape pro zastavení nahrávání/mluvení
      if (e.key === 'Escape') {
        if (isListening) stopListening();
        if (isSpeaking) stopSpeaking();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputMessage, loading, isListening, isSpeaking, lessonStarted]);

  useEffect(() => {
    loadInitialMessage();
    if (mode === 'voice') initSpeechRecognition();

    return () => {
      // cleanup recognition + audio + timeouts
      if (recognitionRef.current) {
        try { recognitionRef.current.onresult = null; recognitionRef.current.onend = null; recognitionRef.current.onerror = null; recognitionRef.current.stop(); } catch (e) {}
        recognitionRef.current = null;
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      synthRef.current.cancel();
      if (sendTimeoutRef.current) {
        clearTimeout(sendTimeoutRef.current);
        sendTimeoutRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Speech recognition init (upravené) ---
  const initSpeechRecognition = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      console.warn('Speech recognition není podporováno v tomto prohlížeči');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = false;
    recognitionRef.current.interimResults = false;
    recognitionRef.current.lang = 'en-US';

    recognitionRef.current.onresult = (event) => {
      // Když přijde výsledek, uloží se text a spustí se odpočítávání před odesláním
      const transcript = event.results[0][0].transcript.trim();
      console.log('🎙️ Rozpoznaný text:', transcript);
      setInputMessage(transcript);

      // zrušíme předchozí timeout, pokud byl
      if (sendTimeoutRef.current) {
        clearTimeout(sendTimeoutRef.current);
        sendTimeoutRef.current = null;
      }

      // Pokud je autoSend zapnuté (kontrolujeme přes ref - vždy aktuální hodnota),
      // naplánujeme odeslání s malým delayem (SEND_DELAY_MS).
      if (autoSendRef.current && mode === 'voice') {
        sendTimeoutRef.current = setTimeout(() => {
          sendTimeoutRef.current = null;
          // ještě jednou ověříme, že autoSend je stále zapnuté
          if (autoSendRef.current) {
            handleAutoSend(transcript);
          } else {
            // pokud už uživatel mezitím autoSend vypnul, pouze ukončíme listening stav
            setIsListening(false);
          }
        }, SEND_DELAY_MS);
      } else {
        // pokud nechceš autoSend, pouze ukončíme listening a necháme text v inputu
        setIsListening(false);
      }
    };

    recognitionRef.current.onerror = (event) => {
      console.error('❌ Speech recognition error:', event.error);
      setIsListening(false);
      // clear any pending send timeout
      if (sendTimeoutRef.current) {
        clearTimeout(sendTimeoutRef.current);
        sendTimeoutRef.current = null;
      }
    };

    recognitionRef.current.onend = () => {
      // pokud recognition skončil (např. kvůli krátké pauze), necháme sendTimeout běžet
      // pouze nastavíme stav isListening false (pokud už nebyl)
      setIsListening(false);
    };
  };

  // --- start/stop listening (zrušení timeoutů) ---
  const startListening = () => {
    if (mode !== 'voice') return;
    if (!recognitionRef.current) initSpeechRecognition();
    if (recognitionRef.current && !isListening && !isSpeaking) {
      try {
        // pokud je aktivní nějaký naplánovaný send, smažeme ho - začínáme nový záznam
        if (sendTimeoutRef.current) {
          clearTimeout(sendTimeoutRef.current);
          sendTimeoutRef.current = null;
        }
        recognitionRef.current.start();
        setIsListening(true);
        console.log('🎤 Listening started...');
      } catch (err) {
        console.error('Chyba při startu nahrávání:', err);
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      setIsListening(false);
    }
    // zrušíme naplánované automatické odeslání
    if (sendTimeoutRef.current) {
      clearTimeout(sendTimeoutRef.current);
      sendTimeoutRef.current = null;
    }
  };

  // --- TTS ---
  const speak = async (text, callback = null) => {
    if (mode !== 'voice') return;
    console.log('🔊 TTS play:', text.substring(0, 40) + '...');
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsSpeaking(true);

    try {
      const response = await fetch(`${API_URL}/api/tts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) throw new Error('TTS request failed');

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onplay = () => setIsSpeaking(true);
      audio.onended = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
        if (typeof callback === 'function') callback();
      };

      await audio.play();
    } catch (err) {
      console.error('❌ TTS error:', err);
      setIsSpeaking(false);
      if (typeof callback === 'function') callback();
    }
  };

  const stopSpeaking = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsSpeaking(false);
  };

  // --- load messages ---
  const loadInitialMessage = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/session/${sessionId}`);
      if (res.data.messages?.length > 0) setMessages(res.data.messages);
    } catch (err) {
      console.error('Chyba při načítání session:', err);
    }
  };


  // Načíst významná slova pro zprávu
  const loadImportantWords = async (messageId, text) => {
    if (importantWords[messageId]) return Promise.resolve(); // Už načteno
    
    try {
      const res = await axios.post(`${API_URL}/api/analyze/words`, {
        text,
        level
      });
      setImportantWords(prev => ({
        ...prev,
        [messageId]: res.data.words || []
      }));
      return Promise.resolve();
    } catch (err) {
      console.error('Chyba při načítání významných slov:', err);
      return Promise.resolve();
    }
  };

  // Přeložit slovo
  const translateWord = async (word, messageId) => {
    const key = `${messageId}-${word}`;
    if (wordTranslations[key]) return wordTranslations[key];
    
    try {
      const res = await axios.post(`${API_URL}/api/translate/word`, {
        word
      });
      setWordTranslations(prev => ({
        ...prev,
        [key]: res.data.translation
      }));
      return res.data.translation;
    } catch (err) {
      console.error('Chyba při překladu slova:', err);
      return null;
    }
  };

  // Přeložit celou větu
  const translateSentence = async (sentence, messageId) => {
    if (sentenceTranslations[messageId]) {
      return sentenceTranslations[messageId];
    }
    
    try {
      const res = await axios.post(`${API_URL}/api/translate/sentence`, {
        sentence
      });
      setSentenceTranslations(prev => ({
        ...prev,
        [messageId]: res.data.translation
      }));
      return res.data.translation;
    } catch (err) {
      console.error('Chyba při překladu věty:', err);
      return null;
    }
  };

  // Komponenta pro zobrazení textu s podtrženými slovy
  const TextWithHighlights = ({ text, messageId, messageIndex }) => {
    const [hoveredWord, setHoveredWord] = useState(null);
    const [hoverTranslation, setHoverTranslation] = useState(null);
    const [loadingWords, setLoadingWords] = useState(false);
    
    useEffect(() => {
      if (text && messageId && !importantWords[messageId]) {
        setLoadingWords(true);
        loadImportantWords(messageId, text).finally(() => setLoadingWords(false));
      }
    }, [text, messageId]);

    const words = importantWords[messageId] || [];
    
    // Pokud ještě načítáme slova nebo není žádné, zobrazíme původní text
    if (loadingWords || words.length === 0) {
      return <span>{text}</span>;
    }

    // Vytvoříme regex pro nalezení významných slov
    const wordsMap = new Map(words.map(w => [w.word.toLowerCase(), w.translation || '']));
    
    // Rozdělíme text na části s významnými slovy
    const parts = [];
    let lastIndex = 0;
    const textLower = text.toLowerCase();
    
    // Najdeme všechna významná slova v textu
    const foundWords = [];
    words.forEach(({ word }) => {
      const regex = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
      let match;
      while ((match = regex.exec(text)) !== null) {
        foundWords.push({
          word: match[0],
          start: match.index,
          end: match.index + match[0].length,
          translation: wordsMap.get(word.toLowerCase())
        });
      }
    });
    
    // Seřadíme podle pozice
    foundWords.sort((a, b) => a.start - b.start);
    
    // Vytvoříme části textu
    foundWords.forEach((found, idx) => {
      // Přidáme text před slovem
      if (found.start > lastIndex) {
        parts.push({
          type: 'text',
          content: text.substring(lastIndex, found.start)
        });
      }
      
      // Přidáme podtržené slovo
      parts.push({
        type: 'word',
        content: text.substring(found.start, found.end),
        translation: found.translation,
        word: found.word
      });
      
      lastIndex = found.end;
    });
    
    // Přidáme zbytek textu
    if (lastIndex < text.length) {
      parts.push({
        type: 'text',
        content: text.substring(lastIndex)
      });
    }
    
    // Pokud nenašli žádná slova, vrátíme původní text
    if (parts.length === 0 || (parts.length === 1 && parts[0].type === 'text')) {
      return <span>{text}</span>;
    }

    return (
      <span>
        {parts.map((part, idx) => {
          if (part.type === 'text') {
            return <span key={idx}>{part.content}</span>;
          }
          
          return (
            <span key={idx} style={{ position: 'relative', display: 'inline-block' }}>
              <span
                className="highlighted-word"
                onMouseEnter={async () => {
                  setHoveredWord(part.word);
                  if (!part.translation) {
                    const translation = await translateWord(part.word, messageId);
                    setHoverTranslation(translation);
                  } else {
                    setHoverTranslation(part.translation);
                  }
                }}
                onMouseLeave={() => {
                  setHoveredWord(null);
                  setHoverTranslation(null);
                }}
              >
                {part.content}
              </span>
              {hoveredWord === part.word && hoverTranslation && (
                <span className="word-tooltip">{hoverTranslation}</span>
              )}
            </span>
          );
        })}
      </span>
    );
  };

  // --- send message ---
  const handleSendMessage = async (messageText) => {
    if (!messageText.trim()) return;
    if (mode === 'voice') stopListening();

    const userMessage = { role: 'user', content: messageText, timestamp: new Date() };
    setMessages((prev) => [...prev, userMessage]);
    setInputMessage('');
    setLoading(true);

    try {
      const res = await axios.post(`${API_URL}/api/session/message`, {
        sessionId,
        message: messageText,
        correctImmediately,
      });

      // Aktualizujeme poslední uživatelskou zprávu s chybami
      setMessages((prev) => {
        const updated = [...prev];
        const lastUserIndex = updated.length - 1;
        if (updated[lastUserIndex]?.role === 'user') {
          updated[lastUserIndex] = {
            ...updated[lastUserIndex],
            mistakes: res.data.mistakes
          };
          // Automaticky otevřít chyby pro tuto zprávu
          if (res.data.mistakes?.length > 0) {
            setExpandedMistakes(prevExpanded => ({
              ...prevExpanded,
              [lastUserIndex]: true
            }));
          }
        }
        return updated;
      });

      // Přidáme AI odpověď BEZ chyb
      const aiMessage = {
        role: 'assistant',
        content: res.data.message,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);

      if (autoPlay && mode === 'voice') {
        setTimeout(() => speak(res.data.message, () => {
          // after TTS, start listening again (pokud stále v lesson a mode voice)
          if (mode === 'voice') startListening();
        }), 500);
      } else {
        // pokud není autoPlay, necháme microfon v tom stavu, který chce user
        if (mode === 'voice') {
          // malé zpoždění, aby uživatel mohl začít mluvit
          setTimeout(() => startListening(), 300);
        }
      }
    } catch (err) {
      console.error('Chyba při odeslání zprávy:', err);
      alert('Nepodařilo se odeslat zprávu.');
      if (mode === 'voice') startListening();
    } finally {
      setLoading(false);
    }
  };

  const handleAutoSend = (text) => {
    // Zabezpečení: zrušíme plán, když už bylo odesláno
    if (sendTimeoutRef.current) {
      clearTimeout(sendTimeoutRef.current);
      sendTimeoutRef.current = null;
    }
    handleSendMessage(text);
  };

  const handleEndLesson = () => {
    stopSpeaking();
    if (sendTimeoutRef.current) {
      clearTimeout(sendTimeoutRef.current);
      sendTimeoutRef.current = null;
    }
    setShowSummary(true);
  };

  // --- start lesson button behavior ---
  const handleStartLesson = () => {
    setLessonStarted(true);
    if (mode === 'voice' && messages.length > 0 && messages[0].role === 'assistant') {
      speak(messages[0].content, () => {
        console.log('🎧 Po úvodní zprávě zapínám mikrofon...');
        startListening();
      });
    }
  };

  if (showSummary) return <MistakesSummary sessionId={sessionId} onClose={onEnd} />;

  return (
    <div className="chat-interface">
      <div className="chat-header">
        <div>
          <h2>Úroveň: {level}</h2>
          <p>{mode === 'voice' ? '🎙️ Hlasová konverzace' : '💬 Textová konverzace'}</p>
          {lessonStarted && (
            <div className="lesson-stats">
              <span>💬 {stats.messages} zpráv</span>
              <span>⚠️ {stats.mistakes} chyb</span>
              <span>📊 {stats.messages > 0 ? Math.round((1 - stats.mistakes / stats.messages) * 100) : 100}% úspěšnost</span>
            </div>
          )}
        </div>

        <div className="header-controls">
          {mode === 'voice' && (
            <>
              <label className="auto-play-toggle">
                <input
                  type="checkbox"
                  checked={autoPlay}
                  onChange={(e) => setAutoPlay(e.target.checked)}
                />
                <span>🔊 Auto-play</span>
              </label>
              <label className="auto-play-toggle">
                <input
                  type="checkbox"
                  checked={autoSend}
                  onChange={(e) => {
                    setAutoSend(e.target.checked);
                    autoSendRef.current = e.target.checked; // aktualizujeme ref hned
                    // pokud vypínáš autoSend, zrušíme případný pending send
                    if (!e.target.checked && sendTimeoutRef.current) {
                      clearTimeout(sendTimeoutRef.current);
                      sendTimeoutRef.current = null;
                    }
                  }}
                />
                <span>🎯 Hned odeslat po nahrávání</span>
              </label>
            </>
          )}
          <button className="end-button" onClick={handleEndLesson}>
            Ukončit lekci
          </button>
        </div>
      </div>

      <div className="messages-container">
        {messages.map((msg, i) => (
          <div key={i} className={`message ${msg.role}`}>
            <div className="message-content">
              {msg.role === 'assistant' ? (
                <TextWithHighlights 
                  text={msg.content} 
                  messageId={`msg-${i}`}
                  messageIndex={i}
                />
              ) : (
                msg.content
              )}
              {msg.role === 'assistant' && (
                <>
                  {mode === 'voice' && (
                    <button className="speak-button" onClick={() => speak(msg.content)}>
                      🔊
                    </button>
                  )}
                  <button 
                    className="translate-button" 
                    onClick={async () => {
                      const messageId = `msg-${i}`;
                      await translateSentence(msg.content, messageId);
                    }}
                    title="Přeložit větu do češtiny"
                  >
                    🇨🇿
                  </button>
                </>
              )}
            </div>
            {/* Překlad zprávy */}
            {msg.role === 'assistant' && sentenceTranslations[`msg-${i}`] && (
              <div className="message-translation">
                <strong>CZ:</strong> "{sentenceTranslations[`msg-${i}`]}"
              </div>
            )}
            {/* Chyby se zobrazují pouze u uživatelských zpráv */}
            {msg.role === 'user' && msg.mistakes?.length > 0 && (
              <div className="mistakes-detail">
                <div 
                  className="mistakes-header"
                  onClick={() => setExpandedMistakes(prev => ({
                    ...prev,
                    [i]: !prev[i]
                  }))}
                  style={{ cursor: 'pointer' }}
                >
                  ⚠️ {msg.mistakes.length} {msg.mistakes.length === 1 ? 'chyba' : 'chyb(y)'}
                  <span style={{ marginLeft: '0.5rem', fontSize: '0.8rem' }}>
                    {expandedMistakes[i] !== false ? '▼' : '▶'}
                  </span>
                </div>
                {expandedMistakes[i] !== false && (
                  <div className="mistakes-expanded">
                    {msg.mistakes.map((mistake, idx) => (
                      <div key={idx} className="mistake-detail-item">
                        <div className="mistake-type-badge">
                          {mistake.type === 'grammar' && '📚 Gramatika'}
                          {mistake.type === 'spelling' && '✍️ Pravopis'}
                          {mistake.type === 'word-order' && '🔄 Slovosled'}
                          {mistake.type === 'vocabulary' && '📖 Slovní zásoba'}
                        </div>
                        <div className="mistake-comparison">
                          <div className="mistake-wrong">
                            <strong>Chyba:</strong> {mistake.original}
                          </div>
                          <div className="mistake-arrow">→</div>
                          <div className="mistake-correct">
                            <strong>Správně:</strong> {mistake.corrected}
                          </div>
                        </div>
                        <div className="mistake-explanation-box">
                          <strong>Vysvětlení:</strong> {mistake.explanation}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {!lessonStarted && messages.length > 0 && messages[0].role === 'assistant' && (
          <div className="start-conversation-prompt">
            <button
              className="start-conversation-button"
              onClick={handleStartLesson}
              disabled={isSpeaking}
            >
              ▶️ Začít lekci
            </button>
          </div>
        )}

        {loading && (
          <div className="message assistant">
            <div className="message-content typing">AI lektor píše...</div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {toastMessage && (
        <div className="toast">
          {toastMessage}
        </div>
      )}

      {lessonStarted && (
        <form
          className="input-container"
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage(inputMessage);
          }}
        >
          {isSpeaking && (
            <button type="button" className="stop-speaking-button" onClick={stopSpeaking}>
              🔇 Stop
            </button>
          )}

          {mode === 'voice' && (
            <button
              type="button"
              className={`mic-button ${isListening ? 'listening' : ''}`}
              onClick={() => {
                if (isListening) stopListening();
                else startListening();
              }}
              disabled={loading}
            >
              {isListening ? '⏹️' : '🎤'}
            </button>
          )}

          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder={
              mode === 'voice'
                ? isListening
                  ? 'Nahrávám...'
                  : 'Řekněte nebo napište odpověď...'
                : 'Napište svou odpověď...'
            }
            disabled={loading || (mode === 'voice' && isListening)}
          />

          <button type="submit" disabled={loading || !inputMessage.trim()}>
            Odeslat
          </button>
        </form>
      )}
    </div>
  );
}

export default ChatInterface;
