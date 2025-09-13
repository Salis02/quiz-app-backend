const express = require('express');
const authController = require('../controllers/authController');
const { validate, schemas } = require('../middlewares/validation');

const router = express.Router();

// Public routes
router.post('/register', validate(schemas.register), authController.register);
router.post('/login', validate(schemas.login), authController.login);

module.exports = router;