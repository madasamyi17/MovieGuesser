const pool = require('../config/db');

// Get all leaderboard entries sorted by total_score
exports.getLeaderboard = async (req, res) => {
  let conn;
  try {
    const { limit = 50, offset = 0 } = req.query;
    console.log("Leader borad data"); 
    conn = await pool.getConnection();
    const [rows] = await conn.query(
      `SELECT user_id, username, total_score, max_score, total_games, updated_at 
       FROM leader_board 
       ORDER BY total_score DESC 
       LIMIT ? OFFSET ?`,
      [parseInt(limit), parseInt(offset)]
    );
    console.log("Leader borad data",rows);  
    if (rows.length === 0) {
      return res.status(200).json({ 
        message: "No leaderboard entries found", 
        data: [] 
      });
    }

    res.json({ data: rows });
  } catch (error) {
    console.error("❌ Error fetching leaderboard:", error);
    res.status(500).json({ error: "Failed to fetch leaderboard" });
  } finally {
    if (conn) conn.release();
  }
};

// Get user rank and stats
exports.getUserRank = async (req, res) => {
  let conn;
  try {
    const { user_id } = req.params;

    if (!user_id) {
      return res.status(400).json({ error: "Missing user_id" });
    }

    conn = await pool.getConnection();
    
    // Get user stats
    const [userStats] = await conn.query(
      `SELECT user_id, username, total_score, max_score, total_games, updated_at 
       FROM leader_board 
       WHERE user_id = ?`,
      [user_id]
    );

    if (userStats.length === 0) {
      return res.status(404).json({ error: "User not found in leaderboard" });
    }

    // Get user rank
    const [rankResult] = await conn.query(
      `SELECT COUNT(*) as rank 
       FROM leader_board 
       WHERE total_score > (SELECT total_score FROM leader_board WHERE user_id = ?)`,
      [user_id]
    );

    const rank = rankResult[0].rank + 1;

    res.json({ 
      rank, 
      stats: userStats[0] 
    });
  } catch (error) {
    console.error("❌ Error fetching user rank:", error);
    res.status(500).json({ error: "Failed to fetch user rank" });
  } finally {
    if (conn) conn.release();
  }
};

// Add or update leaderboard entry for a user (Single Transaction)
exports.updateLeaderboardScore = async (req, res) => {
  let conn;
  try {
    const { user_id, username, current_score } = req.body;
    const normalizedScore = Number(current_score);

    if (!user_id || !username || current_score === undefined || Number.isNaN(normalizedScore)) {
      return res.status(400).json({ 
        error: "Missing or invalid user_id, username, or current_score" 
      });
    }

    conn = await pool.getConnection();
    
    // Start transaction
    await conn.beginTransaction();

    try {
      // Check if user exists in leaderboard
      const [existingUser] = await conn.query(
        `SELECT total_score, max_score, total_games FROM leader_board WHERE user_id = ?`,
        [user_id]
      );

      let newTotalScore, newMaxScore, newTotalGames;

      if (existingUser.length > 0) {
        // Update existing entry
        newTotalScore = Number(existingUser[0].total_score) + normalizedScore;
        newMaxScore = Math.max(Number(existingUser[0].max_score), normalizedScore);
        newTotalGames = existingUser[0].total_games + 1;

        await conn.query(
          `UPDATE leader_board 
           SET username = ?, total_score = ?, max_score = ?, total_games = ?, updated_at = CURRENT_TIMESTAMP
           WHERE user_id = ?`,
          [username, newTotalScore, newMaxScore, newTotalGames, user_id]
        );
      } else {
        // Insert new entry
        newTotalScore = normalizedScore;
        newMaxScore = normalizedScore;
        newTotalGames = 1;

        await conn.query(
          `INSERT INTO leader_board (user_id, username, total_score, max_score, total_games)
           VALUES (?, ?, ?, ?, 1)`,
          [user_id, username, normalizedScore, normalizedScore]
        );
      }

      // Commit transaction
      await conn.commit();

      res.json({ 
        message: existingUser.length > 0 ? "Leaderboard updated successfully" : "Leaderboard entry created successfully",
        total_score: newTotalScore,
        max_score: newMaxScore,
        total_games: newTotalGames,
        current_score: normalizedScore
      });
    } catch (error) {
      // Rollback transaction on error
      await conn.rollback();
      throw error;
    }
  } catch (error) {
    console.error("❌ Error updating leaderboard:", error);
    res.status(500).json({ error: "Failed to update leaderboard" });
  } finally {
    if (conn) conn.release();
  }
};

// Get top N users
exports.getTopUsers = async (req, res) => {
  let conn;
  try {
    const { limit = 10 } = req.query;

    conn = await pool.getConnection();
    const [rows] = await conn.query(
      `SELECT user_id, username, total_score, max_score, total_games 
       FROM leader_board 
       ORDER BY total_score DESC 
       LIMIT ?`,
      [parseInt(limit)]
    );

    res.json({ data: rows });
  } catch (error) {
    console.error("❌ Error fetching top users:", error);
    res.status(500).json({ error: "Failed to fetch top users" });
  } finally {
    if (conn) conn.release();
  }
};

// Delete leaderboard entry (if user deletes account)
exports.deleteLeaderboardEntry = async (req, res) => {
  let conn;
  try {
    const { user_id } = req.params;

    if (!user_id) {
      return res.status(400).json({ error: "Missing user_id" });
    }

    conn = await pool.getConnection();
    const [result] = await conn.query(
      `DELETE FROM leader_board WHERE user_id = ?`,
      [user_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "User not found in leaderboard" });
    }

    res.json({ message: "Leaderboard entry deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting leaderboard entry:", error);
    res.status(500).json({ error: "Failed to delete leaderboard entry" });
  } finally {
    if (conn) conn.release();
  }
};

// Reset a user's scores (optional)
exports.resetUserScores = async (req, res) => {
  let conn;
  try {
    const { user_id } = req.params;

    if (!user_id) {
      return res.status(400).json({ error: "Missing user_id" });
    }

    conn = await pool.getConnection();
    await conn.query(
      `UPDATE leader_board 
       SET total_score = 0, max_score = 0, total_games = 0, updated_at = CURRENT_TIMESTAMP
       WHERE user_id = ?`,
      [user_id]
    );

    res.json({ 
      message: "User scores reset successfully",
      total_score: 0,
      max_score: 0,
      total_games: 0
    });
  } catch (error) {
    console.error("❌ Error resetting user scores:", error);
    res.status(500).json({ error: "Failed to reset user scores" });
  } finally {
    if (conn) conn.release();
  }
};
