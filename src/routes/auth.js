const express = require('express');
const authController = require('../controllers/authController');
const {authenticate } = require('../middlewares/auth')
const { validate, schemas } = require('../middlewares/validation');

const router = express.Router();

// Public routes
router.post('/register', validate(schemas.register), authController.register);
router.post('/login', validate(schemas.login), authController.login);
router.get('/me', authenticate, authController.me);

module.exports = router;