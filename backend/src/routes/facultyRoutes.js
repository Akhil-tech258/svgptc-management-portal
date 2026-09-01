const express = require('express');
const router = express.Router();
const facultyController = require('../controllers/facultyController');
const { requireFaculty } = require('../middleware/auth');

router.use(requireFaculty);

router.get('/dashboard', facultyController.getFacultyDashboard);
router.get('/students', facultyController.searchStudents);
router.get('/dues', facultyController.getDepartmentDues);
router.post('/dues', facultyController.createStudentDue);
router.post('/dues/add', facultyController.addDue);
router.patch('/dues/:dueId/clear', facultyController.clearDue);
router.post('/dues/:dueId/clear', facultyController.clearDue);
router.delete('/dues/:dueId', facultyController.clearDue);
router.post('/dues/:dueId/delete', facultyController.clearDue);
router.post('/dues/clear-all', facultyController.clearAllDues);
router.post('/approve', facultyController.approveDepartment);
router.post('/clearance/approve', facultyController.approveDepartment);


module.exports = router;
