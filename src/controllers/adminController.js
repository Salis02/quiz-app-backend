const adminService = require('../services/adminService');

class AdminController {
  async createCategory(req, res, next) {
    try {
      const adminId = req.user.id;
      const category = await adminService.createCategory(req.body, adminId);
      
      res.status(201).json({
        success: true,
        message: 'Category created successfully',
        data: category
      });
    } catch (error) {
      next(error);
    }
  }

  async getCategories(req, res, next) {
    try {
      const categories = await adminService.getCategories();
      
      res.status(200).json({
        success: true,
        message: 'Categories retrieved successfully',
        data: categories
      });
    } catch (error) {
      next(error);
    }
  }

  async createQuiz(req, res, next) {
    try {
      const adminId = req.user.id;
      const quiz = await adminService.createQuiz(req.body, adminId);
      
      res.status(201).json({
        success: true,
        message: 'Quiz created successfully',
        data: quiz
      });
    } catch (error) {
      next(error);
    }
  }

  async getQuiz(req, res, next) {
    try {
      const quizId = parseInt(req.params.id);
      const quiz = await adminService.getQuizById(quizId);
      
      res.status(200).json({
        success: true,
        message: 'Quiz retrieved successfully',
        data: quiz
      });
    } catch (error) {
      next(error);
    }
  }

  async addQuestion(req, res, next) {
    try {
      const quizId = parseInt(req.params.id);
      const adminId = req.user.id;
      const question = await adminService.addQuestion(quizId, req.body, adminId);
      
      res.status(201).json({
        success: true,
        message: 'Question added successfully',
        data: question
      });
    } catch (error) {
      next(error);
    }
  }

  async addOption(req, res, next) {
    try {
      const questionId = parseInt(req.params.id);
      const adminId = req.user.id;
      const option = await adminService.addOption(questionId, req.body, adminId);
      
      res.status(201).json({
        success: true,
        message: 'Option added successfully',
        data: option
      });
    } catch (error) {
      next(error);
    }
  }

  async publishQuiz(req, res, next) {
    try {
      const quizId = parseInt(req.params.id);
      const adminId = req.user.id;
      const quiz = await adminService.publishQuiz(quizId, adminId);
      
      res.status(200).json({
        success: true,
        message: 'Quiz published successfully',
        data: quiz
      });
    } catch (error) {
      next(error);
    }
  }

  async getQuizResults(req, res, next) {
    try {
      const quizId = parseInt(req.params.quizId);
      const adminId = req.user.id;
      const results = await adminService.getQuizResults(quizId, adminId);
      
      res.status(200).json({
        success: true,
        message: 'Quiz results retrieved successfully',
        data: results
      });
    } catch (error) {
      next(error);
    }
  }

  async getAllQuizzes(req, res, next) {
    try {
      const adminId = req.user.id;
      const quizzes = await adminService.getAllQuizzes(adminId);
      
      res.status(200).json({
        success: true,
        message: 'Quizzes retrieved successfully',
        data: quizzes
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AdminController();