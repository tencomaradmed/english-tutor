import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './UserProfile.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

function UserProfile({ username, onBack }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, [username]);

  const loadProfile = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/user/${username}/profile`);
      setProfile(response.data);
    } catch (error) {
      console.error('Chyba při načítání profilu:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="profile-container">
        <div className="profile-loading">Načítám profil...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="profile-container">
        <div className="profile-error">
          <p>Nepodařilo se načíst profil</p>
          <button onClick={onBack} className="back-button">Zpět</button>
        </div>
      </div>
    );
  }

  const totalStats = profile.stats.total || { total_lessons: 0, total_mistakes: 0, total_messages: 0 };

  return (
    <div className="profile-container">
      <div className="user-profile">
        <div className="profile-header-card">
          <div className="profile-avatar">👤</div>
          <div className="profile-info">
            <h2>Můj profil</h2>
            <p>Člen od: {new Date(profile.user.memberSince).toLocaleDateString('cs-CZ')}</p>
          </div>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">📚</div>
            <div className="stat-value">{totalStats.total_lessons || 0}</div>
            <div className="stat-label">Dokončených lekcí</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">💬</div>
            <div className="stat-value">{totalStats.total_messages || 0}</div>
            <div className="stat-label">Celkem zpráv</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">⚠️</div>
            <div className="stat-value">{totalStats.total_mistakes || 0}</div>
            <div className="stat-label">Celkem chyb</div>
          </div>
          <div className="stat-card highlight">
            <div className="stat-icon">📈</div>
            <div className="stat-value">
              {totalStats.total_messages > 0 
                ? Math.round((1 - (totalStats.total_mistakes / totalStats.total_messages)) * 100)
                : 0}%
            </div>
            <div className="stat-label">Úspěšnost</div>
          </div>
        </div>

        {profile.stats.byLevel && profile.stats.byLevel.length > 0 && (
          <div className="section">
            <h3>📊 Statistiky podle úrovně</h3>
            <div className="level-cards">
              {profile.stats.byLevel.map(stat => (
                <div key={stat.level} className="level-card-stats">
                  <h4>{stat.level}</h4>
                  <div className="level-stat-row">
                    <span>Lekcí:</span>
                    <strong>{stat.lessons_completed}</strong>
                  </div>
                  <div className="level-stat-row">
                    <span>Zpráv:</span>
                    <strong>{stat.total_messages}</strong>
                  </div>
                  <div className="level-stat-row">
                    <span>Chyb:</span>
                    <strong>{stat.total_mistakes}</strong>
                  </div>
                  {stat.last_lesson_date && (
                    <div className="last-lesson">
                      Poslední: {new Date(stat.last_lesson_date).toLocaleDateString('cs-CZ')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {profile.stats.mistakesByType && profile.stats.mistakesByType.length > 0 && (
          <div className="section">
            <h3>🎯 Rozložení chyb podle typu</h3>
            <div className="mistakes-chart">
              {profile.stats.mistakesByType.map(mistake => {
                const percentage = (mistake.count / totalStats.total_mistakes) * 100;
                return (
                  <div key={mistake.mistake_type} className="mistake-bar-row">
                    <div className="mistake-label">
                      {mistake.mistake_type === 'grammar' && '📚 Gramatika'}
                      {mistake.mistake_type === 'spelling' && '✍️ Pravopis'}
                      {mistake.mistake_type === 'word-order' && '🔄 Slovosled'}
                      {mistake.mistake_type === 'vocabulary' && '📖 Slovní zásoba'}
                    </div>
                    <div className="mistake-bar-container">
                      <div 
                        className="mistake-bar-fill" 
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <div className="mistake-count">{mistake.count}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {profile.recentLessons && profile.recentLessons.length > 0 && (
          <div className="section">
            <h3>📝 Poslední lekce</h3>
            <div className="lessons-list">
              {profile.recentLessons.map(lesson => (
                <div key={lesson.id} className="lesson-item">
                  <div className="lesson-header-row">
                    <span className="lesson-level">{lesson.level}</span>
                    <span className="lesson-scenario">
                      {lesson.scenario === 'airport' && '✈️ Letiště'}
                      {lesson.scenario === 'restaurant' && '🍽️ Restaurace'}
                      {lesson.scenario === 'hotel' && '🏨 Hotel'}
                      {lesson.scenario === 'cafe' && '☕ Kavárna'}
                      {lesson.scenario === 'shop' && '🛍️ Obchod'}
                      {lesson.scenario === 'doctor' && '🏥 Lékař'}
                      {lesson.scenario === 'job-interview' && '💼 Pohovor'}
                      {lesson.scenario === 'bank' && '🏦 Banka'}
                      {lesson.scenario === 'random' && '🎲 Náhodný'}
                    </span>
                  </div>
                  <div className="lesson-stats-row">
                    <span>💬 {lesson.total_messages} zpráv</span>
                    <span>⚠️ {lesson.total_mistakes} chyb</span>
                    <span className="lesson-date">
                      {new Date(lesson.started_at).toLocaleDateString('cs-CZ')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {profile.unpracticedMistakes && profile.unpracticedMistakes.length > 0 && (
          <div className="section">
            <h3>🔄 Chyby k procvičení</h3>
            <p className="section-description">
              Tyto chyby jsi nedávno udělal - zkus na ně dát pozor v příští lekci!
            </p>
            <div className="mistakes-list">
              {profile.unpracticedMistakes.slice(0, 5).map(mistake => (
                <div key={mistake.id} className="mistake-item-card">
                  <div className="mistake-type-badge-small">
                    {mistake.mistake_type === 'grammar' && '📚 Gramatika'}
                    {mistake.mistake_type === 'spelling' && '✍️ Pravopis'}
                    {mistake.mistake_type === 'word-order' && '🔄 Slovosled'}
                    {mistake.mistake_type === 'vocabulary' && '📖 Slovní zásoba'}
                  </div>
                  <div className="mistake-text">
                    <div className="mistake-wrong-text">❌ {mistake.original_text}</div>
                    <div className="mistake-correct-text">✅ {mistake.corrected_text}</div>
                  </div>
                  <div className="mistake-explanation-text">
                    {mistake.explanation}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default UserProfile;