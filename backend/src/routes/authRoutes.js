const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateOptional } = require('../middleware/auth');

router.post('/student/register', authController.studentRegister);
router.post('/student/login', authController.studentLogin);
router.post('/faculty/login', authController.facultyLogin);
router.post('/clerk/login', authController.clerkLogin);
router.get('/me', authenticateOptional, authController.getMe);

module.exports = router;
