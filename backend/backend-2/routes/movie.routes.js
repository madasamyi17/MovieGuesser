const express = require('express');
const router = express.Router();
const movieController = require('../controller/movie.controller');
const auth = require('../middleware/auth.middleware');

// GET - Fetch next random question
router.get('/movieguess', movieController.getNextQuestion);

// POST - Handle different movie operations based on query type
router.post('/movieguess', (req, res, next) => {
  const type = req.query.type;
  
  switch(type) {
    case 'clue':
      return movieController.getClue(req, res);
    case 'answerCheck':
      return movieController.checkAnswer(req, res);
    case 'leaderboard':
      return movieController.getLeaderboard(req, res);
    default:
      return res.status(400).json({ error: 'Invalid type parameter' });
  }
});

module.exports = router;