const express = require('express');
const router = express.Router();
const certificateController = require('../controllers/certificateController');
const { requireClerk } = require('../middleware/auth');

// Strictly Clerk access only: anonymous users and students are completely blocked
router.use(requireClerk);

router.get('/:student_pin/nodues-form', certificateController.getNoDuesFormData);
router.get('/:student_pin', certificateController.getCertificateDetails);
router.get('/:student_pin/version/:version', certificateController.getCertificateByVersion);

module.exports = router;
