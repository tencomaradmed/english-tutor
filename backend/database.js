const Database = require('better-sqlite3');
const path = require('path');

// Vytvoření/připojení k databázi
const db = new Database(path.join(__dirname, 'english-tutor.db'));

// Vytvoření tabulek
function initDatabase() {
  // Tabulka pro uživatelské profily
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Tabulka pro lekce
  db.exec(`
    CREATE TABLE IF NOT EXISTS lessons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      level TEXT NOT NULL,
      scenario TEXT NOT NULL,
      started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      ended_at DATETIME,
      total_messages INTEGER DEFAULT 0,
      total_mistakes INTEGER DEFAULT 0,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Tabulka pro zprávy v konverzaci
  db.exec(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lesson_id INTEGER NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (lesson_id) REFERENCES lessons(id)
    )
  `);

  // Tabulka pro chyby
  db.exec(`
    CREATE TABLE IF NOT EXISTS mistakes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lesson_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      original_text TEXT NOT NULL,
      corrected_text TEXT NOT NULL,
      mistake_type TEXT NOT NULL,
      explanation TEXT NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      practiced BOOLEAN DEFAULT 0,
      FOREIGN KEY (lesson_id) REFERENCES lessons(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Tabulka pro statistiky pokroku
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_stats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      level TEXT NOT NULL,
      lessons_completed INTEGER DEFAULT 0,
      total_mistakes INTEGER DEFAULT 0,
      total_messages INTEGER DEFAULT 0,
      last_lesson_date DATETIME,
      FOREIGN KEY (user_id) REFERENCES users(id),
      UNIQUE(user_id, level)
    )
  `);

  console.log('✅ Databáze inicializována');
}

// CRUD operace pro uživatele
const userDB = {
  create: (username) => {
    const stmt = db.prepare('INSERT INTO users (username) VALUES (?)');
    return stmt.run(username).lastInsertRowid;
  },
  
  findByUsername: (username) => {
    const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
    return stmt.get(username);
  },
  
  getOrCreate: (username) => {
    let user = userDB.findByUsername(username);
    if (!user) {
      const userId = userDB.create(username);
      user = { id: userId, username };
    }
    return user;
  }
};

// CRUD operace pro lekce
const lessonDB = {
  create: (userId, level, scenario) => {
    const stmt = db.prepare(
      'INSERT INTO lessons (user_id, level, scenario) VALUES (?, ?, ?)'
    );
    return stmt.run(userId, level, scenario).lastInsertRowid;
  },
  
  end: (lessonId, totalMessages, totalMistakes) => {
    const stmt = db.prepare(`
      UPDATE lessons 
      SET ended_at = CURRENT_TIMESTAMP, total_messages = ?, total_mistakes = ?
      WHERE id = ?
    `);
    return stmt.run(totalMessages, totalMistakes, lessonId);
  },
  
  getById: (lessonId) => {
    const stmt = db.prepare('SELECT * FROM lessons WHERE id = ?');
    return stmt.get(lessonId);
  },
  
  getUserLessons: (userId, limit = 10) => {
    const stmt = db.prepare(`
      SELECT * FROM lessons 
      WHERE user_id = ? 
      ORDER BY started_at DESC 
      LIMIT ?
    `);
    return stmt.all(userId, limit);
  }
};

// CRUD operace pro zprávy
const messageDB = {
  create: (lessonId, role, content) => {
    const stmt = db.prepare(
      'INSERT INTO messages (lesson_id, role, content) VALUES (?, ?, ?)'
    );
    return stmt.run(lessonId, role, content).lastInsertRowid;
  },
  
  getByLesson: (lessonId) => {
    const stmt = db.prepare('SELECT * FROM messages WHERE lesson_id = ? ORDER BY timestamp');
    return stmt.all(lessonId);
  }
};

// CRUD operace pro chyby
const mistakeDB = {
  create: (lessonId, userId, original, corrected, type, explanation) => {
    const stmt = db.prepare(`
      INSERT INTO mistakes (lesson_id, user_id, original_text, corrected_text, mistake_type, explanation)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    return stmt.run(lessonId, userId, original, corrected, type, explanation).lastInsertRowid;
  },
  
  getByLesson: (lessonId) => {
    const stmt = db.prepare('SELECT * FROM mistakes WHERE lesson_id = ? ORDER BY timestamp');
    return stmt.all(lessonId);
  },
  
  getByUser: (userId, limit = 50) => {
    const stmt = db.prepare(`
      SELECT * FROM mistakes 
      WHERE user_id = ? 
      ORDER BY timestamp DESC 
      LIMIT ?
    `);
    return stmt.all(userId, limit);
  },
  
  getUnpracticedByUser: (userId, limit = 10) => {
    const stmt = db.prepare(`
      SELECT * FROM mistakes 
      WHERE user_id = ? AND practiced = 0 
      ORDER BY timestamp DESC 
      LIMIT ?
    `);
    return stmt.all(userId, limit);
  },
  
  markAsPracticed: (mistakeId) => {
    const stmt = db.prepare('UPDATE mistakes SET practiced = 1 WHERE id = ?');
    return stmt.run(mistakeId);
  },
  
  getMistakesByType: (userId) => {
    const stmt = db.prepare(`
      SELECT mistake_type, COUNT(*) as count 
      FROM mistakes 
      WHERE user_id = ? 
      GROUP BY mistake_type
    `);
    return stmt.all(userId);
  }
};

// Operace pro statistiky
const statsDB = {
  updateOrCreate: (userId, level) => {
    const stmt = db.prepare(`
      INSERT INTO user_stats (user_id, level, lessons_completed, last_lesson_date)
      VALUES (?, ?, 1, CURRENT_TIMESTAMP)
      ON CONFLICT(user_id, level) DO UPDATE SET
        lessons_completed = lessons_completed + 1,
        last_lesson_date = CURRENT_TIMESTAMP
    `);
    return stmt.run(userId, level);
  },
  
  incrementMistakes: (userId, level, count) => {
    const stmt = db.prepare(`
      UPDATE user_stats 
      SET total_mistakes = total_mistakes + ?
      WHERE user_id = ? AND level = ?
    `);
    return stmt.run(count, userId, level);
  },
  
  incrementMessages: (userId, level, count) => {
    const stmt = db.prepare(`
      UPDATE user_stats 
      SET total_messages = total_messages + ?
      WHERE user_id = ? AND level = ?
    `);
    return stmt.run(count, userId, level);
  },
  
  getByUser: (userId) => {
    const stmt = db.prepare('SELECT * FROM user_stats WHERE user_id = ? ORDER BY level');
    return stmt.all(userId);
  },
  
  getTotalStats: (userId) => {
    const stmt = db.prepare(`
      SELECT 
        SUM(lessons_completed) as total_lessons,
        SUM(total_mistakes) as total_mistakes,
        SUM(total_messages) as total_messages
      FROM user_stats 
      WHERE user_id = ?
    `);
    return stmt.get(userId);
  }
};

module.exports = {
  db,
  initDatabase,
  userDB,
  lessonDB,
  messageDB,
  mistakeDB,
  statsDB
};