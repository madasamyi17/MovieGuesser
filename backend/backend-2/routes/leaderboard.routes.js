const express = require('express');
const router = express.Router();
const leaderboardController = require('../controller/leaderboard.controller');

// GET - Fetch all leaderboard entries (paginated)
router.get('/leaderboard', leaderboardController.getLeaderboard);

// GET - Fetch top N users
router.get('/leaderboard/top', leaderboardController.getTopUsers);

// GET - Get user rank and stats
router.get('/leaderboard/user/:user_id', leaderboardController.getUserRank);

// POST - Update leaderboard score (insert or update)
router.post('/leaderboard', leaderboardController.updateLeaderboardScore);

// DELETE - Delete leaderboard entry
router.delete('/leaderboard/:user_id', leaderboardController.deleteLeaderboardEntry);

// PUT - Reset user scores
router.put('/leaderboard/reset/:user_id', leaderboardController.resetUserScores);

module.exports = router;
