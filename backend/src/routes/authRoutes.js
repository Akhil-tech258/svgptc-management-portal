const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateOptional } = require('../middleware/auth');
const { loginRateLimiter } = require('../middleware/rateLimiter');

router.post('/student/register', loginRateLimiter, authController.studentRegister);
router.post('/student/login', loginRateLimiter, authController.studentLogin);
router.post('/faculty/login', loginRateLimiter, authController.facultyLogin);
router.post('/clerk/login', loginRateLimiter, authController.clerkLogin);
router.get('/me', authenticateOptional, authController.getMe);

module.exports = router;
