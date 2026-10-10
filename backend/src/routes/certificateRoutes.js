const express = require('express');
const router = express.Router();
const certificateController = require('../controllers/certificateController');
const { authenticateOptional } = require('../middleware/auth');

// Any authenticated role (Student, Faculty, Clerk) can view certificate / nodues form
router.get('/:student_pin/nodues-form', authenticateOptional, certificateController.getNoDuesFormData);
router.get('/:student_pin', authenticateOptional, certificateController.getCertificateDetails);
router.get('/:student_pin/version/:version', authenticateOptional, certificateController.getCertificateByVersion);

module.exports = router;
