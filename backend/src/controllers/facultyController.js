const db = require('../config/db');

async function getFacultyDashboard(req, res) {
  try {
    const deptId = req.faculty.department_id;
    const deptName = req.faculty.department_name || '';
    const isNccDept = deptName.toUpperCase().includes('NSS') || deptName.toUpperCase().includes('NCC');

    let query = `
      SELECT 
        dc.id as clearance_id,
        dc.request_id,
        dc.student_pin,
        dc.status as clearance_status,
        dc.approved_by,
        dc.approved_at,
        dc.last_notified_at,
        sm.student_name,
        sm.admission_no,
        sm.course_branch,
        ndr.submitted_at,
        ndr.is_ncc_cadet
       FROM department_clearances dc
       JOIN students_master sm ON LOWER(sm.pin) = LOWER(dc.student_pin)
       JOIN no_dues_requests ndr ON ndr.id = dc.request_id
       WHERE dc.department_id = $1
    `;
    const params = [deptId];

    if (isNccDept) {
      query += ` AND ndr.is_ncc_cadet = 1`;
    }

    query += ` ORDER BY ndr.submitted_at DESC`;

    // Fetch all clearance requests for this department
    const requestsRes = await db.query(query, params);


    // Fetch dues in this department
    const duesRes = await db.query(
      `SELECT * FROM dues WHERE department_id = $1 ORDER BY id DESC`,
      [deptId]
    );

    const duesByPin = {};
    duesRes.rows.forEach(d => {
      if (!duesByPin[d.student_pin]) duesByPin[d.student_pin] = [];
      duesByPin[d.student_pin].push(d);
    });

    let pendingCount = 0;
    let approvedCount = 0;
    let dueFoundCount = 0;

    const studentList = requestsRes.rows.map(row => {
      const studentDues = duesByPin[row.student_pin] || [];
      const activeDues = studentDues.filter(d => d.status === 'Active');
      const clearedDues = studentDues.filter(d => d.status === 'Cleared');

      let currentStatus = row.clearance_status;
      if (activeDues.length > 0) {
        currentStatus = 'Due Found';
      }

      if (currentStatus === 'Approved') approvedCount++;
      else if (currentStatus === 'Due Found') dueFoundCount++;
      else pendingCount++;

      return {
        clearance_id: row.clearance_id,
        request_id: row.request_id,
        student_pin: row.student_pin,
        student_name: row.student_name,
        admission_no: row.admission_no,
        course_branch: row.course_branch,
        submitted_at: row.submitted_at,
        last_notified_at: row.last_notified_at,
        clearance_status: currentStatus,
        approved_by: row.approved_by,
        approved_at: row.approved_at,
        active_dues: activeDues,
        cleared_dues: clearedDues
      };
    });

    const totalActiveDues = duesRes.rows.filter(d => d.status === 'Active').length;
    const totalClearedDues = duesRes.rows.filter(d => d.status === 'Cleared').length;

    // Badge count: pending + due found that need action
    const newOrPendingNotificationCount = pendingCount;

    return res.json({
      success: true,
      faculty: req.faculty,
      stats: {
        pending_requests: pendingCount,
        active_dues: totalActiveDues,
        approved_requests: approvedCount,
        cleared_dues: totalClearedDues,
        notification_badge_count: newOrPendingNotificationCount
      },
      requests: studentList
    });
  } catch (err) {
    console.error('getFacultyDashboard error:', err);
    return res.status(500).json({ success: false, error: 'Failed to fetch faculty dashboard.' });
  }
}

async function searchStudents(req, res) {
  try {
    const search = (req.query.search || req.query.query || '').trim();
    if (!search) {
      const resStudents = await db.query(
        'SELECT pin, student_name, admission_no, course_branch FROM students_master ORDER BY pin ASC LIMIT 20'
      );
      return res.json({ success: true, students: resStudents.rows });
    }

    const pattern = `%${search}%`;
    const resStudents = await db.query(
      `SELECT pin, student_name, admission_no, course_branch 
       FROM students_master 
       WHERE LOWER(pin) LIKE LOWER($1) OR LOWER(student_name) LIKE LOWER($2) OR LOWER(admission_no) LIKE LOWER($3)
       ORDER BY pin ASC LIMIT 25`,
      [pattern, pattern, pattern]
    );

    return res.json({ success: true, students: resStudents.rows });
  } catch (err) {
    console.error('searchStudents error:', err);
    return res.status(500).json({ success: false, error: 'Failed to search students.' });
  }
}

async function getDepartmentDues(req, res) {
  try {
    const deptId = req.faculty.department_id;
    const duesRes = await db.query(
      `SELECT d.*, sm.student_name, sm.course_branch, sm.admission_no
       FROM dues d
       LEFT JOIN students_master sm ON LOWER(sm.pin) = LOWER(d.student_pin)
       WHERE d.department_id = $1
       ORDER BY d.id DESC`,
      [deptId]
    );

    return res.json({
      success: true,
      dues: duesRes.rows
    });
  } catch (err) {
    console.error('getDepartmentDues error:', err);
    return res.status(500).json({ success: false, error: 'Failed to fetch department dues.' });
  }
}

async function addDue(req, res) {
  return createStudentDue(req, res);
}

async function createStudentDue(req, res) {
  try {
    const deptId = req.faculty.department_id;
    const { student_pin, reason, amount } = req.body;

    if (!student_pin || !reason || !reason.trim()) {
      return res.status(400).json({ success: false, error: 'Student PIN and due reason are required.' });
    }

    const cleanPin = student_pin.trim();
    const cleanReason = reason.trim();
    const cleanAmount = (amount !== undefined && amount !== null && amount !== '') ? amount.toString().trim() : '0';

    // Verify student exists in students_master
    const masterRes = await db.query('SELECT * FROM students_master WHERE LOWER(pin) = LOWER($1)', [cleanPin]);
    if (masterRes.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: `Student with PIN "${cleanPin}" was not found in college master records. Please verify PIN.`
      });
    }

    const student = masterRes.rows[0];

    // Insert new active due
    await db.query(
      `INSERT INTO dues (department_id, student_pin, reason, amount, status, created_by)
       VALUES ($1, $2, $3, $4, 'Active', $5)`,
      [deptId, student.pin, cleanReason, cleanAmount, req.faculty.username]
    );

    // If clearance request already exists for this department, mark it as 'Due Found'
    await db.query(
      `UPDATE department_clearances 
       SET status = 'Due Found', approved_by = NULL, approved_at = NULL 
       WHERE LOWER(student_pin) = LOWER($1) AND department_id = $2`,
      [student.pin, deptId]
    );

    return res.status(201).json({
      success: true,
      message: `Official due recorded successfully for ${student.student_name} (${student.pin}).`
    });
  } catch (err) {
    console.error('createStudentDue error:', err);
    return res.status(500).json({ success: false, error: 'Failed to record student due: ' + err.message });
  }
}

async function clearDue(req, res) {
  try {
    const deptId = req.faculty.department_id;
    const { dueId } = req.params;

    const dueRes = await db.query(
      'SELECT * FROM dues WHERE id = $1 AND department_id = $2',
      [dueId, deptId]
    );

    if (dueRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Due not found in your department.' });
    }

    const due = dueRes.rows[0];

    // Mark as cleared
    await db.query(
      `UPDATE dues SET status = 'Cleared', cleared_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [dueId]
    );

    // Check if any active dues remain for this student
    const activeDuesRes = await db.query(
      `SELECT COUNT(*) as count FROM dues WHERE LOWER(student_pin) = LOWER($1) AND department_id = $2 AND status = 'Active'`,
      [due.student_pin, deptId]
    );

    const remainingActive = parseInt(activeDuesRes.rows[0].count, 10);
    if (remainingActive === 0) {
      // Re-set clearance status to Pending (ready for approval)
      await db.query(
        `UPDATE department_clearances SET status = 'Pending' WHERE LOWER(student_pin) = LOWER($1) AND department_id = $2`,
        [due.student_pin, deptId]
      );
    }

    return res.json({
      success: true,
      message: 'Due marked as Cleared. Request is now re-checkable without a new student request.',
      remainingActiveDues: remainingActive
    });
  } catch (err) {
    console.error('clearDue error:', err);
    return res.status(500).json({ success: false, error: 'Failed to clear due.' });
  }
}

async function clearAllDues(req, res) {
  try {
    const deptId = req.faculty.department_id;
    const { student_pin } = req.body;

    if (!student_pin) {
      return res.status(400).json({ success: false, error: 'student_pin is required.' });
    }

    const cleanPin = student_pin.trim();

    await db.query(
      `UPDATE dues 
       SET status = 'Cleared', cleared_at = CURRENT_TIMESTAMP 
       WHERE LOWER(student_pin) = LOWER($1) AND department_id = $2 AND status = 'Active'`,
      [cleanPin, deptId]
    );

    // Update clearance status to Pending
    await db.query(
      `UPDATE department_clearances 
       SET status = 'Pending' 
       WHERE LOWER(student_pin) = LOWER($1) AND department_id = $2`,
      [cleanPin, deptId]
    );

    return res.json({
      success: true,
      message: 'All dues for this student have been cleared successfully.'
    });
  } catch (err) {
    console.error('clearAllDues error:', err);
    return res.status(500).json({ success: false, error: 'Failed to clear all dues.' });
  }
}

async function approveDepartment(req, res) {
  try {
    const deptId = req.faculty.department_id;
    const { student_pin, department_id } = req.body;

    if (!student_pin) {
      return res.status(400).json({ success: false, error: 'student_pin is required.' });
    }

    // Backend Authorization: faculty can strictly only approve their own assigned department
    if (department_id && parseInt(department_id, 10) !== deptId) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized: Faculty can only approve clearance for their assigned department.'
      });
    }

    const cleanPin = student_pin.trim();

    // Check for any active dues
    const activeDuesRes = await db.query(
      `SELECT COUNT(*) as count FROM dues WHERE LOWER(student_pin) = LOWER($1) AND department_id = $2 AND status = 'Active'`,
      [cleanPin, deptId]
    );

    if (parseInt(activeDuesRes.rows[0].count, 10) > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot mark completed while active dues remain. Please clear all dues first.'
      });
    }

    // Approve the department clearance
    await db.query(
      `UPDATE department_clearances 
       SET status = 'Approved', approved_by = $1, approved_at = CURRENT_TIMESTAMP 
       WHERE LOWER(student_pin) = LOWER($2) AND department_id = $3`,
      [req.faculty.username, cleanPin, deptId]
    );

    // Check if all other clearances for this student's request are approved
    const pendingRes = await db.query(
      `SELECT COUNT(*) as count 
       FROM department_clearances 
       WHERE LOWER(student_pin) = LOWER($1) AND status != 'Approved'`,
      [cleanPin]
    );

    const pendingCount = parseInt(pendingRes.rows[0].count, 10);
    if (pendingCount === 0) {
      await db.query(
        `UPDATE no_dues_requests 
         SET status = 'Completed', completed_at = CURRENT_TIMESTAMP 
         WHERE LOWER(student_pin) = LOWER($1) AND status != 'Completed'`,
        [cleanPin]
      );
    }

    return res.json({
      success: true,
      message: `Department clearance marked as completed for student ${cleanPin}.`,
      allDepartmentsCompleted: pendingCount === 0
    });
  } catch (err) {
    console.error('approveDepartment error:', err);
    return res.status(500).json({ success: false, error: 'Failed to approve department clearance.' });
  }
}


module.exports = {
  getFacultyDashboard,
  addDue,
  createStudentDue,
  clearDue,
  clearAllDues,
  approveDepartment,
  searchStudents,
  getDepartmentDues
};
