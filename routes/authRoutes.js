// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

// Публичные роуты
router.post('/register', authController.register);
router.post('/login', authController.login);

// Защищенные роуты для предпочтений
router.get('/preferences', authMiddleware, authController.getPreferences);
router.put('/preferences', authMiddleware, authController.updatePreferences);

module.exports = router;