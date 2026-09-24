const express = require('express');
const router = express.Router();
const multer = require('multer');
const clerkController = require('../controllers/clerkController');
const { requireClerk } = require('../middleware/auth');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Protected Clerk routes
router.use(requireClerk);


router.get('/dashboard', clerkController.getClerkDashboard);
router.post('/excel/preview', upload.single('file'), clerkController.previewExcelImport);
router.post('/excel/commit', clerkController.commitExcelImport);

// Student Master Search & Single Record CRUD
router.get('/students', clerkController.getStudentsMaster);
router.post('/students', clerkController.createSingleStudent);
router.delete('/students/purge-all', clerkController.purgeAllStudents);
router.post('/students/purge-all', clerkController.purgeAllStudents);
router.delete('/students/:pin', clerkController.deleteSingleStudent);
router.post('/students/:pin/delete', clerkController.deleteSingleStudent);
router.put('/students/:pin', clerkController.updateStudentMaster);



router.get('/faculty-accounts', clerkController.getFacultyAccounts);
router.post('/faculty-accounts', clerkController.createFacultyAccount);
router.patch('/faculty-accounts/:id/scope', clerkController.updateFacultyScope);
router.post('/faculty-accounts/:id/scope', clerkController.updateFacultyScope);
router.patch('/faculty-accounts/:id/status', clerkController.toggleFacultyStatus);
router.post('/faculty-accounts/:id/status', clerkController.toggleFacultyStatus);
router.delete('/faculty-accounts/:id', clerkController.deleteFacultyAccount);
router.post('/faculty-accounts/:id/delete', clerkController.deleteFacultyAccount);
router.post('/faculty-accounts/:id/reset-password', clerkController.resetFacultyPassword);

router.get('/branches', clerkController.getBranches);
router.post('/branches', clerkController.createBranch);
router.patch('/branches/:id/status', clerkController.toggleBranchStatus);
router.post('/branches/:id/status', clerkController.toggleBranchStatus);
router.delete('/branches/:id', clerkController.deleteBranch);
router.post('/branches/:id/delete', clerkController.deleteBranch);

router.get('/departments', clerkController.getDepartments);
router.post('/departments', clerkController.createDepartment);
router.post('/departments/physical-approval', clerkController.recordPhysicalApproval);
router.put('/departments/:id', clerkController.updateDepartment);
router.post('/departments/:id', clerkController.updateDepartment);
router.delete('/departments/:id', clerkController.deleteDepartment);
router.post('/departments/:id/delete', clerkController.deleteDepartment);



router.get('/certificates/students', clerkController.getCertificateStudents);
router.post('/certificates/data', clerkController.updateCertificateData);
router.post('/certificates/verify-lock', clerkController.verifyAndLockCertificate);
router.post('/certificates/unlock', clerkController.unlockCertificate);
router.post('/certificates/generate', clerkController.generateCertificate);
router.get('/certificates/audit/:student_pin', clerkController.getCertificateAuditHistory);

module.exports = router;
