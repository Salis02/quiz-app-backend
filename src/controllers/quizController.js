const quizService = require('../services/quizService');

class QuizController {
  async getPublicQuizzes(req, res, next) {
    try {
      const quizzes = await quizService.getPublicQuizzes();
      
      res.status(200).json({
        success: true,
        message: 'Public quizzes retrieved successfully',
        data: quizzes
      });
    } catch (error) {
      next(error);
    }
  }

  async startQuiz(req, res, next) {
    try {
      const quizId = parseInt(req.params.id);
      const userId = req.user.id;
      
      const result = await quizService.startQuiz(userId, quizId);
      
      res.status(200).json({
        success: true,
        message: 'Quiz started successfully',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async submitAnswer(req, res, next) {
    try {
      const questionId = parseInt(req.params.id);
      const userId = req.user.id;
      const { option_id } = req.body;
      
      const result = await quizService.submitAnswer(userId, questionId, option_id);
      
      res.status(200).json({
        success: true,
        message: 'Answer submitted successfully',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async finishQuiz(req, res, next) {
    try {
      const quizId = parseInt(req.params.id);
      const userId = req.user.id;
      
      const result = await quizService.finishQuiz(userId, quizId);
      
      res.status(200).json({
        success: true,
        message: 'Quiz completed successfully',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async getUserResults(req, res, next) {
    try {
      const userId = req.user.id;
      
      const results = await quizService.getUserResults(userId);
      
      res.status(200).json({
        success: true,
        message: 'User results retrieved successfully',
        data: results
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new QuizController();