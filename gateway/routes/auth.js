const express = require('express');
const router = express.Router();
const { authController } = require('../controllers');
const { authenticateToken } = require('../middleware/auth');

router.post('/register', authController.register);

router.post('/login', authController.login);

router.post('/logout', authenticateToken, authController.logout);

router.get('/me', authenticateToken, authController.getMe);

module.exports = router;

