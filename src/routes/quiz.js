const express = require('express');
const quizController = require('../controllers/quizController');
const { authenticate } = require('../middlewares/auth');
const { validate, schemas } = require('../middlewares/validation');

const router = express.Router();

// Public routes
router.get('/public', quizController.getPublicQuizzes);

// Protected user routes
router.post('/:id/start', authenticate, quizController.startQuiz);
router.post('/:id/finish', authenticate, quizController.finishQuiz);

// Results routes
router.get('/results/me', authenticate, quizController.getUserResults);

// Answer submission
router.post('/questions/:id/answer', 
  authenticate, 
  validate(schemas.submitAnswer), 
  quizController.submitAnswer
);

module.exports = router;