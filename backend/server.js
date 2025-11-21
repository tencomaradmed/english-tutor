const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');
require('dotenv').config();

const { 
  initDatabase, 
  userDB, 
  lessonDB, 
  messageDB, 
  mistakeDB,
  statsDB 
} = require('./database');

// Inicializace databáze
initDatabase();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'English Tutor API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      test: '/api/test',
      startSession: '/api/session/start',
      sendMessage: '/api/session/message',
      getSession: '/api/session/:sessionId',
      getMistakes: '/api/session/:sessionId/mistakes',
      getUserProfile: '/api/user/:username/profile',
      getUserLessons: '/api/user/:username/lessons',
      tts: '/api/tts',
      translateWord: '/api/translate/word',
      translateSentence: '/api/translate/sentence',
      analyzeWords: '/api/analyze/words'
    }
  });
});

app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend funguje!' });
});

const scenarioDescriptions = {
  'airport': 'At the airport — the student arrives at the check-in counter to drop off luggage, goes through security control, and needs to find the correct gate. The atmosphere is busy, with announcements and other travelers around.',
  'restaurant': 'At a restaurant — the student looks at the menu, orders food and drinks, and possibly deals with a small issue (wrong order, delay, or missing item). The setting is friendly but slightly formal.',
  'hotel': 'At a hotel — the student is checking in at the reception, asking about available services (breakfast, Wi-Fi, gym), or reporting a problem with their room.',
  'cafe': 'At a café — the student is ordering coffee, tea, or snacks and may start a casual conversation with the barista or another customer. The environment is relaxed and informal.',
  'shop': 'At a clothing store — the student is looking for specific clothes, asking about sizes, trying items on, and possibly returning or exchanging a purchase.',
  'doctor': 'At the doctor’s office — the student describes their symptoms, answers questions about their health, and listens to advice or possible diagnoses.',
  'job-interview': 'At a job interview — the student answers questions about their background, education, and professional experience. The interviewer might also ask situational or personality questions.',
  'bank': 'At the bank — the student wants to open a new account, apply for a card, or ask about loans and other banking services.',
  'random': 'Unexpected situation — choose a surprising, engaging, and unusual real-life context that challenges the student to think creatively and use spontaneous English.'
};

const systemPrompts = {
  A1: (s) => `
You are an English tutor for A1 (beginner) level.
Use simple present tense and basic phrases only.

SCENARIO: ${scenarioDescriptions[s]}

Start the conversation by introducing yourself, describing the environment briefly, and asking one simple question about the situation.
Stay friendly and patient.
`,
  A2: (s) => `
You are an English tutor for A2 (elementary) level.
Use basic grammar and short everyday questions.

SCENARIO: ${scenarioDescriptions[s]}

Start by describing the surroundings to set the scene, then greet the student and ask one simple but natural question.
`,
  B1: (s) => `
You are an English tutor for B1 (intermediate) level.
Use common tenses and invite the student to express opinions and experiences.

SCENARIO: ${scenarioDescriptions[s]}

Start with a short vivid description of the place, then ask a question that encourages a full-sentence answer.
`,
  B2: (s) => `
You are an English tutor for B2 (upper-intermediate) level.
Use phrasal verbs, idioms, and complex tenses.

SCENARIO: ${scenarioDescriptions[s]}

Start by describing the atmosphere and immediately ask a question that requires reasoning or use of different tenses (e.g., “What would you have done if...?”).
`,
  C1: (s) => `
You are an English tutor for C1 (advanced) level.
Use advanced vocabulary, idiomatic language, and detailed questions.

SCENARIO: ${scenarioDescriptions[s]}

Describe the environment richly, then ask a thought-provoking or hypothetical question to test fluency.
`,
  C2: (s) => `
You are an English tutor for C2 (proficiency) level.
Use complex grammar, idioms, and natural-sounding speech.

SCENARIO: ${scenarioDescriptions[s]}

Start by painting a vivid scene and then immediately ask a deep or abstract question using advanced grammar or conditionals.
`
};

app.post('/api/session/start', async (req, res) => {
  try {
    const { level, scenario = 'random', username = 'guest' } = req.body;  // PŘIDÁN username
    
    // Validace úrovně
    if (!systemPrompts[level]) {
      return res.status(400).json({ error: 'Neplatná úroveň' });
    }
    
    // Získej nebo vytvoř uživatele
    const user = userDB.getOrCreate(username);
    
    // Vytvoř lekci v databázi
    const lessonId = lessonDB.create(user.id, level, scenario);
    
    // První zpráva od AI - zahájení scénáře
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemPrompts[level](scenario) },
        { role: "user", content: "Start the conversation now. Remember: ONE short greeting and ONE question only!" }
      ],
      temperature: 0.8
    });
    
    const aiMessage = completion.choices[0].message.content;
    
    // Ulož zprávu do databáze
    messageDB.create(lessonId, 'assistant', aiMessage);
    
    res.json({
      sessionId: lessonId.toString(),  // Použijeme lessonId jako sessionId
      message: aiMessage,
      level,
      scenario,
      userId: user.id
    });
    
  } catch (error) {
    console.error('Chyba při zahájení session:', error);
    res.status(500).json({ error: 'Chyba serveru' });
  }
});

app.post('/api/session/message', async (req, res) => {
  try {
    const { sessionId, message, correctImmediately = false } = req.body;
    
    // Načti lekci z databáze
    const lesson = lessonDB.getById(parseInt(sessionId));
    if (!lesson) {
      return res.status(404).json({ error: 'Lekce nenalezena' });
    }
    
    // Detekce chyb ve zprávě studenta
    const mistakeAnalysis = await detectMistakes(message, lesson.level);
    
    // Ulož chyby do databáze
    if (mistakeAnalysis.hasMistakes) {
      mistakeAnalysis.mistakes.forEach(mistake => {
        mistakeDB.create(
          lesson.id,
          lesson.user_id,
          mistake.original,
          mistake.corrected,
          mistake.type,
          mistake.explanation
        );
      });
    }
    
    // Ulož zprávu od studenta
    messageDB.create(lesson.id, 'user', message);
    
    // Načti historii zpráv z databáze
    const dbMessages = messageDB.getByLesson(lesson.id);
    
    // Příprava zpráv pro OpenAI
    let messages = [
      { role: "system", content: systemPrompts[lesson.level](lesson.scenario) }
    ];
    
    // Pokud chceme opravovat hned, přidáme instrukci
    if (correctImmediately && mistakeAnalysis.hasMistakes) {
      messages.push({
        role: "system",
        content: `The student made these mistakes: ${JSON.stringify(mistakeAnalysis.mistakes)}. 
        Gently correct them during the conversation - don't interrupt, but naturally use the correct form.`
      });
    }
    
    // Přidání historie konverzace
    messages = messages.concat(
      dbMessages.map(m => ({
        role: m.role,
        content: m.content
      }))
    );
    
    // Zavolání OpenAI API
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: messages,
      temperature: 0.8
    });
    
    const aiMessage = completion.choices[0].message.content;
    
    // Ulož odpověď AI
    messageDB.create(lesson.id, 'assistant', aiMessage);
    
    res.json({
      message: aiMessage,
      mistakes: mistakeAnalysis.hasMistakes ? mistakeAnalysis.mistakes : null
    });
    
  } catch (error) {
    console.error('Chyba při zpracování zprávy:', error);
    res.status(500).json({ error: 'Chyba serveru' });
  }
});

app.get('/api/session/:sessionId', (req, res) => {
  try {
    const lessonId = parseInt(req.params.sessionId);
    
    const lesson = lessonDB.getById(lessonId);
    if (!lesson) {
      return res.status(404).json({ error: 'Lekce nenalezena' });
    }
    
    const messages = messageDB.getByLesson(lessonId);
    
    res.json({
      lesson,
      messages: messages.map(m => ({
        role: m.role,
        content: m.content,
        timestamp: m.timestamp
      }))
    });
  } catch (error) {
    console.error('Chyba při načítání session:', error);
    res.status(500).json({ error: 'Chyba serveru' });
  }
});

app.get('/api/session/:sessionId/mistakes', (req, res) => {
  try {
    const lessonId = parseInt(req.params.sessionId);
    
    const lesson = lessonDB.getById(lessonId);
    if (!lesson) {
      return res.status(404).json({ error: 'Lekce nenalezena' });
    }
    
    const mistakes = mistakeDB.getByLesson(lessonId);
    
    // Seskupení chyb podle typu
    const mistakesByType = {
      grammar: [],
      spelling: [],
      'word-order': [],
      vocabulary: []
    };
    
    mistakes.forEach(mistake => {
      if (mistakesByType[mistake.mistake_type]) {
        mistakesByType[mistake.mistake_type].push({
          original: mistake.original_text,
          corrected: mistake.corrected_text,
          explanation: mistake.explanation,
          type: mistake.mistake_type
        });
      }
    });
    
    // Ulož statistiky lekce
    const messageCount = messageDB.getByLesson(lessonId).length;
    lessonDB.end(lessonId, messageCount, mistakes.length);
    
    // Aktualizuj statistiky uživatele
    statsDB.updateOrCreate(lesson.user_id, lesson.level);
    if (mistakes.length > 0) {
      statsDB.incrementMistakes(lesson.user_id, lesson.level, mistakes.length);
    }
    statsDB.incrementMessages(lesson.user_id, lesson.level, messageCount);
    
    res.json({
      totalMistakes: mistakes.length,
      mistakesByType,
      allMistakes: mistakes.map(m => ({
        userMessage: m.original_text,
        mistakes: [{
          original: m.original_text,
          corrected: m.corrected_text,
          type: m.mistake_type,
          explanation: m.explanation
        }]
      }))
    });
  } catch (error) {
    console.error('Chyba při načítání chyb:', error);
    res.status(500).json({ error: 'Chyba serveru' });
  }
});

app.get('/api/user/:username/profile', (req, res) => {
  try {
    const { username } = req.params;
    const user = userDB.findByUsername(username);
    
    if (!user) {
      return res.status(404).json({ error: 'Uživatel nenalezen' });
    }
    
    const stats = statsDB.getByUser(user.id);
    const totalStats = statsDB.getTotalStats(user.id);
    const recentLessons = lessonDB.getUserLessons(user.id, 5);
    const recentMistakes = mistakeDB.getByUser(user.id, 10);
    const mistakesByType = mistakeDB.getMistakesByType(user.id);
    const unpracticedMistakes = mistakeDB.getUnpracticedByUser(user.id);
    
    res.json({
      user: {
        id: user.id,
        username: user.username,
        memberSince: user.created_at
      },
      stats: {
        byLevel: stats,
        total: totalStats,
        mistakesByType
      },
      recentLessons,
      recentMistakes,
      unpracticedMistakes
    });
  } catch (error) {
    console.error('Chyba při načítání profilu:', error);
    res.status(500).json({ error: 'Chyba serveru' });
  }
});

// Endpoint pro historii lekcí
app.get('/api/user/:username/lessons', (req, res) => {
  try {
    const { username } = req.params;
    const user = userDB.findByUsername(username);
    
    if (!user) {
      return res.status(404).json({ error: 'Uživatel nenalezen' });
    }
    
    const lessons = lessonDB.getUserLessons(user.id, 50);
    
    res.json({ lessons });
  } catch (error) {
    console.error('Chyba při načítání lekcí:', error);
    res.status(500).json({ error: 'Chyba serveru' });
  }
});

async function detectMistakes(userMessage, level) {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `Jsi anglický lektor. Analyzuj gramatiku, slovní zásobu, slovosled a pravopis ve zprávě studenta pro úroveň ${level}.
          
          Vrať POUZE JSON objekt v tomto přesném formátu:
          {
            "hasMistakes": true/false,
            "mistakes": [
              {
                "original": "přesný špatný text ze zprávy",
                "corrected": "správná verze",
                "type": "grammar|spelling|word-order|vocabulary",
                "explanation": "Vysvětlení chyby v češtině - proč je to špatně a jak to má být správně"
              }
            ]
          }
          
          DŮLEŽITÉ:
          - Vysvětlení MUSÍ být v češtině a ve druhé osobě (ty) - např. "Zaměnil jsi", "Použil jsi", "Měl bys"
          - Buď konkrétní a jasný
          - I malé chyby detekuj
          - Pokud je zpráva perfektní, vrať hasMistakes: false`
        },
        { role: "user", content: `Analyzuj tuto zprávu: "${userMessage}"` }
      ],
      temperature: 0.1,
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(completion.choices[0].message.content);
    if (result.hasMistakes && result.mistakes) {
      result.mistakes = result.mistakes.filter(m => 
        m.original?.trim().toLowerCase() !== m.corrected?.trim().toLowerCase()
      );
      if (result.mistakes.length === 0) result.hasMistakes = false;
    }
    return result;

  } catch (err) {
    console.error('Chyba při detekci chyb:', err);
    return { hasMistakes: false, mistakes: [] };
  }
}

// 🧠 Funkce pro recap lekce
async function generateRecap(session) {
  try {
    const mistakesText = session.mistakes.length
      ? JSON.stringify(session.mistakes.map(m => m.mistakes))
      : "No mistakes recorded.";

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a supportive English tutor summarizing a completed lesson.
          Create a short recap in English. Mention:
          - what the student did well,
          - the most common mistake types,
          - and 2-3 personalized tips for improvement.
          The tone should be friendly, motivating, and concise (max 8 sentences).`
        },
        { role: "user", content: `Here is the student's conversation and mistakes: ${mistakesText}` }
      ],
      temperature: 0.7
    });

    return completion.choices[0].message.content;

  } catch (err) {
    console.error('Chyba při generování recap:', err);
    return "Lesson recap could not be generated due to a technical issue.";
  }
}

app.post('/api/tts', async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }
    
    console.log('🔊 TTS request pro text:', text.substring(0, 50) + '...');
    
    // Zavolej OpenAI TTS API
    const response = await openai.audio.speech.create({
      model: "tts-1", // nebo "tts-1-hd" pro lepší kvalitu (dražší)
      voice: "nova", // alloy, echo, fable, onyx, nova, shimmer
      input: text,
      speed: 1 // Trochu pomalejší pro učení
    });
    
    // Získej audio jako buffer
    const buffer = Buffer.from(await response.arrayBuffer());
    
    // Pošli jako audio/mpeg
    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': buffer.length
    });
    
    res.send(buffer);
    
  } catch (error) {
    console.error('Chyba při TTS:', error);
    res.status(500).json({ error: 'TTS failed' });
  }
});

// Endpoint pro překlad slov
app.post('/api/translate/word', async (req, res) => {
  try {
    const { word } = req.body;
    
    if (!word) {
      return res.status(400).json({ error: 'Slovo je povinné' });
    }
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "Jsi překladatel. Přelož anglické slovo do češtiny. Vrať POUZE český překlad bez dalších komentářů."
        },
        { role: "user", content: `Přelož: "${word}"` }
      ],
      temperature: 0.1,
      max_tokens: 20
    });
    
    const translation = completion.choices[0].message.content.trim();
    res.json({ translation });
    
  } catch (error) {
    console.error('Chyba při překladu slova:', error);
    res.status(500).json({ error: 'Chyba při překladu' });
  }
});

// Endpoint pro překlad celé věty
app.post('/api/translate/sentence', async (req, res) => {
  try {
    const { sentence } = req.body;
    
    if (!sentence) {
      return res.status(400).json({ error: 'Věta je povinná' });
    }
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "Jsi překladatel. Přelož anglickou větu do češtiny. Vrať POUZE český překlad bez dalších komentářů."
        },
        { role: "user", content: `Přelož: "${sentence}"` }
      ],
      temperature: 0.1,
      max_tokens: 200
    });
    
    const translation = completion.choices[0].message.content.trim();
    res.json({ translation });
    
  } catch (error) {
    console.error('Chyba při překladu věty:', error);
    res.status(500).json({ error: 'Chyba při překladu' });
  }
});

// Endpoint pro detekci významných slov
app.post('/api/analyze/words', async (req, res) => {
  try {
    const { text, level } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'Text je povinný' });
    }
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `Jsi anglický lektor. Identifikuj významná slova ve větě pro úroveň ${level || 'A1'}. 
          
          Vrať POUZE JSON objekt v tomto formátu:
          {
            "words": [
              {
                "word": "exact word from text",
                "translation": "český překlad"
              }
            ]
          }
          
          Vyber pouze slova, která:
          - Student na úrovni ${level || 'A1'} pravděpodobně nezná
          - Jsou důležitá pro pochopení věty
          - Jsou podstatná jména, slovesa, přídavná jména nebo důležitá příslovce
          - NEJSOU: členy (a, an, the), předložky (in, on, at), spojky (and, but, or)
          
          Maximálně 5-8 nejdůležitějších slov.`
        },
        { role: "user", content: `Analyzuj: "${text}"` }
      ],
      temperature: 0.1,
      response_format: { type: "json_object" }
    });
    
    const result = JSON.parse(completion.choices[0].message.content);
    res.json({ words: result.words || [] });
    
  } catch (error) {
    console.error('Chyba při analýze slov:', error);
    res.status(500).json({ error: 'Chyba při analýze' });
  }
});

app.listen(PORT, () => console.log(`✅ Server běží na http://localhost:${PORT}`));
