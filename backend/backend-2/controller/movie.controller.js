const pool = require('../config/db');
const { GoogleGenAI } = require("@google/genai");
require('dotenv').config();

const ai = new GoogleGenAI({
  apiKey: 'AQ.Ab8RN6JS4MT7QxwW6L02DwN2sRD6U59m3EOhkN3QeJ8_oYAfLA',
});

// Get next random question
exports.getNextQuestion = async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const [rows] = await conn.query(
      `SELECT id, imdb_id, movie_name, description FROM movies ORDER BY RAND() LIMIT 1`
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "No questions found in DB" });
    }
    console.log("Fetched question:", rows[0]);
    const { movie_name, imdb_id, description, id } = rows[0];
    return res.json({ movie_name, imdb_id, description, id });
  } catch (error) {
    console.error("❌ Error fetching question:", error);
    res.status(500).json({ error: "Failed to fetch question" });
  } finally {
    if (conn) conn.release();
  }
};

// Get clue for a question
exports.getClue = async (req, res) => {
  let conn;
  try {
    const { clueNo, imdb_id } = req.body;

    if (clueNo === undefined || !imdb_id) {
      return res.status(400).json({ error: "Missing clueNo or imdb_id" });
    }

    conn = await pool.getConnection();
    const [rows] = await conn.query(
      `SELECT clue FROM clues WHERE imdb_id = ? LIMIT 1 OFFSET ?`,
      [imdb_id, clueNo]
    );

    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: "Clue not found" });
    }

    res.json({ clue: rows[0].clue });
  } catch (error) {
    console.error("❌ Error fetching clue:", error);
    res.status(500).json({ error: "Failed to fetch clue" });
  } finally {
    if (conn) conn.release();
  }
};

// Check answer using AI
exports.checkAnswer = async (req, res) => {
  let conn;
  try {
    const { id, userAnswer } = req.body;

    if (!id || !userAnswer) {
      return res.status(400).json({ error: "Missing id or userAnswer" });
    }

    conn = await pool.getConnection();
    const [rows] = await conn.query(
      `SELECT movie_name FROM movies WHERE imdb_id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Question not found" });
    }

    const movie_name = rows[0].movie_name;
    console.log("Movie name from DB:", movie_name);
    console.log("User answer:", userAnswer);

    const prompt = `
Your task is to determine if the user is referring to the same movie title as the original title.
Only respond with "1" if the user answer refers to the same movie (case-insensitive, minor typos allowed).
Otherwise, respond with "0".

Original Title: ${movie_name}
User Answer: ${userAnswer}
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const result = response.candidates[0].content.parts[0].text.trim();
    console.log("AI Result:", result, "Movie:", movie_name);

    res.json({ answer: result, originalAnswer: movie_name });
  } catch (error) {
    console.error("❌ Error checking answer:", error);
    res.status(500).json({ error: "Failed to check answer" });
  } finally {
    if (conn) conn.release();
  }
};

// Get leaderboard and save user score
exports.getLeaderboard = async (req, res) => {
  let conn;
  try {
    const { username, score } = req.body;

    if (!username || score === undefined) {
      return res.status(400).json({ error: "Missing username or score" });
    }

    conn = await pool.getConnection();

    // Insert user score into leaderboard
    await conn.query(
      `INSERT INTO leader_board (username, score) VALUES (?, ?)`,
      [username, score]
    );


    console.log(`Inserted score for ${username}: ${score}`);
    // Get top 15 scores
    const [rows] = await conn.query(
      `SELECT * FROM leader_board ORDER BY score DESC LIMIT 15`
    );

    res.json(rows);
  } catch (error) {
    console.error("❌ Error with leaderboard:", error);
    res.status(500).json({ error: "Failed to process leaderboard" });
  } finally {
    if (conn) conn.release();
  }
};
