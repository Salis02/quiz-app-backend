const express = require('express');
const adminController = require('../controllers/adminController');
const { authenticate, authorize } = require('../middlewares/auth');
const { validate, schemas } = require('../middlewares/validation');

const router = express.Router();

// All admin routes require authentication and ADMIN role
router.use(authenticate);
router.use(authorize(['ADMIN']));

// Category management
router.post('/categories', validate(schemas.createCategory), adminController.createCategory);
router.get('/categories', adminController.getCategories);

// Quiz management
router.post('/quizzes', validate(schemas.createQuiz), adminController.createQuiz);
router.get('/quizzes', adminController.getAllQuizzes);
router.get('/quizzes/:id', adminController.getQuiz);

// Question management
router.post('/quizzes/:id/questions', validate(schemas.createQuestion), adminController.addQuestion);

// Option management
router.post('/questions/:id/options', validate(schemas.createOption), adminController.addOption);

// Quiz publishing
router.patch('/quizzes/:id/publish', adminController.publishQuiz);
router.patch('/quizzes/:id/unpublish', adminController.unpublishQuiz);

// Results viewing
router.get('/results/:quizId', adminController.getQuizResults);

module.exports = router;