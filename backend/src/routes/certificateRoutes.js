const express = require('express');
const router = express.Router();
const certificateController = require('../controllers/certificateController');
const { authenticateOptional } = require('../middleware/auth');

// Any authenticated role (Student, Faculty, Clerk) can view certificate (student restricted to own PIN)
router.get('/:student_pin', authenticateOptional, certificateController.getCertificateDetails);
router.get('/:student_pin/version/:version', authenticateOptional, certificateController.getCertificateByVersion);

module.exports = router;
