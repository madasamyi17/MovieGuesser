const mysql = require("mysql2/promise");
const fs = require("fs");
const  dotenv = require('dotenv');
// dotenv.config('./.env'); // Load environment variables from .env file
dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "movie_db"
});


(async () => {
  try {
    const conn = await pool.getConnection();
    console.log("✅ Connected to Azure MySQL database.");
    conn.release();
  } catch (err) {
    console.error("❌ DB connection error:", err);
  }
})();



// ✅ Optional: Run your init script
async function runInitScript() {
  const conn = await pool.getConnection();
  await conn.beginTransaction();
  try {
    await conn.query(`CREATE TABLE IF NOT EXISTS Questions (
            id INT AUTO_INCREMENT PRIMARY KEY,
            imdb_id VARCHAR(30) NOT NULL UNIQUE,
            movie_name VARCHAR(255) NOT NULL,
            description TEXT NOT NULL
        );`);

    await conn.query(`CREATE TABLE IF NOT EXISTS Clues (
            id INT AUTO_INCREMENT PRIMARY KEY,
            clue TEXT NOT NULL,
            imdb_id VARCHAR(50) NOT NULL,
            FOREIGN KEY (imdb_id) REFERENCES Questions(imdb_id)
        );`);

    await conn.query(`CREATE TABLE IF NOT EXISTS Leaderboard 
            (
            id INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(50) NOT NULL,
            score INT NOT NULL
            );`);

    await conn.commit();
    console.log("✅ Tables created or verified");
  } catch (error) {
    console.error("❌ Error running init script:", error);
  } finally {
    conn.release();
  }
}
// runInitScript();

// ✅ Export pool after it's declared
module.exports = pool;
