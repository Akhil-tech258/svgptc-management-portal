const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const { requireStudent } = require('../middleware/auth');

router.use(requireStudent);

router.get('/dashboard', studentController.getStudentDashboard);
router.post('/no-dues/submit', studentController.submitNoDuesRequest);
router.post('/no-dues/reset', studentController.resetNoDuesRequest);
router.post('/no-dues/re-notify', studentController.reNotifyDepartment);

module.exports = router;

