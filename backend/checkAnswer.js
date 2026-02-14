const {getMovieName} = require("./getMovieName.js")
const { GoogleGenAI } = require("@google/genai");
require('dotenv').config();
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY, 
});
const pool = require("./forCreatingDataset/db");

async function checkAnswerwithAI(userAnswer, id) {
  let conn;
  try {
    conn = await pool.getConnection();
   console.log(id)
    const [rows] = await conn.query(
      `SELECT movie_name FROM questions WHERE imdb_id = ?`,
      [id]
    );
   // console.log(rows)
    let movie_name = rows[0].movie_name;
    // movie_name = getMovieName(imdb_id);
    console.log("Movie name from DB:", movie_name);
    const prompt = `
Your task is to determine if the user is referring to the same movie title as the original title.
Only respond with "1" if the user answer refers to the same movie (case-insensitive, minor typos allowed).
Otherwise, respond with "0".

Original Title: ${movie_name}
User Answer: ${userAnswer}
`;

    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash-preview",
      contents: prompt,
    });

    let  result = response.candidates[0].content.parts[0].text.trim();
    console.log(result,movie_name)
    return { result, movie_name };
  } catch (error) {
    console.log("DB or AI error:", error);
    return { result: "0", movie_name: "Unknown" };
  } finally {
    if (conn) conn.release(); // ✅ release only here
  }
}

module.exports = { checkAnswerwithAI };
