const db = require('../config/db');

async function getStudentDashboard(req, res) {
  try {
    const pin = req.student.pin;

    // Fetch master record
    const masterRes = await db.query(
      'SELECT * FROM students_master WHERE LOWER(pin) = LOWER($1)',
      [pin]
    );

    if (masterRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Student master record not found.' });
    }
    const studentInfo = masterRes.rows[0];

    // Fetch latest request
    const reqRes = await db.query(
      'SELECT * FROM no_dues_requests WHERE LOWER(student_pin) = LOWER($1) ORDER BY id DESC LIMIT 1',
      [pin]
    );

    let currentRequest = null;
    let departmentClearances = [];
    let isCompleted = false;

    if (reqRes.rows.length > 0) {
      currentRequest = reqRes.rows[0];

      // Fetch clearances
      const clearRes = await db.query(
        `SELECT dc.*, d.type as department_type
         FROM department_clearances dc
         JOIN departments d ON d.id = dc.department_id
         WHERE dc.request_id = $1
         ORDER BY d.id ASC`,
        [currentRequest.id]
      );

      // For each department, check dues
      const duesRes = await db.query(
        'SELECT * FROM dues WHERE LOWER(student_pin) = LOWER($1) AND status = $2',
        [pin, 'Active']
      );


      const duesByDept = {};
      duesRes.rows.forEach(due => {
        if (!duesByDept[due.department_id]) duesByDept[due.department_id] = [];
        duesByDept[due.department_id].push(due);
      });

      let allApproved = clearRes.rows.length > 0;

      departmentClearances = clearRes.rows.map(item => {
        const activeDues = duesByDept[item.department_id] || [];
        let status = item.status;
        if (activeDues.length > 0) {
          status = 'Due Found';
        }

        if (status !== 'Approved') {
          allApproved = false;
        }

        const isNcc = (item.department_name && (item.department_name.toUpperCase().includes('NSS') || item.department_name.toUpperCase().includes('NCC')));
        let effectiveType = item.department_type;
        if (isNcc && currentRequest.is_ncc_cadet !== 1) {
          effectiveType = 'Physical'; // Marked as physical/clerk clearance for non-cadet
        }

        // Calculate 20-hour re-notify eligibility
        let canReNotify = false;
        let remainingHours = 0;
        if (item.last_notified_at) {
          const lastTime = new Date(item.last_notified_at).getTime();
          const elapsedHours = (Date.now() - lastTime) / (1000 * 60 * 60);
          if (elapsedHours >= 20) {
            canReNotify = status === 'Pending' && effectiveType === 'Online';
          } else {
            remainingHours = Math.ceil(20 - elapsedHours);
          }
        } else {
          canReNotify = status === 'Pending' && effectiveType === 'Online';
        }

        return {
          id: item.id,
          department_id: item.department_id,
          department_name: item.department_name,
          department_type: effectiveType,
          status,
          approved_by: item.approved_by,
          approved_at: item.approved_at,
          last_notified_at: item.last_notified_at,
          can_re_notify: canReNotify,
          remaining_hours_to_re_notify: remainingHours,
          active_dues: activeDues.map(d => {
            const isLib = item.department_name && item.department_name.toLowerCase().includes('library');
            return {
              id: d.id,
              reason: d.reason,
              amount: d.amount || '0',
              created_at: d.created_at,
              contact_instruction: isLib
                ? 'Please visit the Library and contact the Librarian physically.'
                : 'Please contact the responsible Lab Incharge physically.'
            };
          })
        };
      });


      // If all approved, mark request completed
      if (allApproved && currentRequest.status !== 'Completed') {
        await db.query(
          'UPDATE no_dues_requests SET status = $1, completed_at = CURRENT_TIMESTAMP WHERE id = $2',
          ['Completed', currentRequest.id]
        );
        currentRequest.status = 'Completed';
      }

      isCompleted = currentRequest.status === 'Completed';
    }

    // If completed, fetch certificate data (read-only)
    let certificateInfo = null;
    if (isCompleted) {
      const certRes = await db.query(
        'SELECT * FROM certificate_data WHERE student_pin = $1',
        [pin]
      );
      const versionRes = await db.query(
        'SELECT * FROM certificate_versions WHERE student_pin = $1 AND is_current = 1 ORDER BY version_number DESC LIMIT 1',
        [pin]
      );

      if (versionRes.rows.length > 0) {
        certificateInfo = {
          status: 'Generated',
          version: versionRes.rows[0].version_number,
          details: versionRes.rows[0]
        };
      } else if (certRes.rows.length > 0) {
        certificateInfo = {
          status: certRes.rows[0].is_locked ? 'Verified & Locked' : 'Under Review',
          details: {
            ...studentInfo,
            ...certRes.rows[0]
          }
        };
      } else {
        certificateInfo = {
          status: 'Pending Verification by Clerk',
          details: studentInfo
        };
      }
    }

    return res.json({
      success: true,
      student: {
        pin: studentInfo.pin,
        admission_no: studentInfo.admission_no,
        student_name: studentInfo.student_name,
        father_name: studentInfo.father_name,
        dob: studentInfo.dob,
        nationality: studentInfo.nationality,
        religion: studentInfo.religion,
        course_branch: studentInfo.course_branch,
        date_of_admission: studentInfo.date_of_admission
      },
      request: currentRequest,
      clearances: departmentClearances,
      is_no_dues_completed: isCompleted,
      certificate: certificateInfo
    });
  } catch (err) {
    console.error('getStudentDashboard error:', err);
    return res.status(500).json({ success: false, error: 'Failed to fetch student dashboard.' });
  }
}

async function submitNoDuesRequest(req, res) {
  try {
    const pin = req.student.pin;

    // Check if there is already an existing pending or completed request
    const existingReq = await db.query(
      'SELECT * FROM no_dues_requests WHERE student_pin = $1 ORDER BY id DESC LIMIT 1',
      [pin]
    );

    if (existingReq.rows.length > 0) {
      const current = existingReq.rows[0];
      if (current.status !== 'Completed') {
        return res.json({
          success: true,
          message: 'No-Dues request is already in progress.',
          requestId: current.id
        });
      }
    }

    // Check is_ncc_cadet from body
    const isNccCadet = (req.body && (req.body.is_ncc_cadet === true || req.body.is_ncc_cadet === 1 || req.body.is_ncc_cadet === '1' || req.body.is_ncc_cadet === 'yes' || req.body.is_ncc_cadet === 'true')) ? 1 : 0;

    // Create new request with is_ncc_cadet
    await db.query(
      'INSERT INTO no_dues_requests (student_pin, status, is_ncc_cadet, submitted_at) VALUES ($1, $2, $3, CURRENT_TIMESTAMP)',
      [pin, 'Pending', isNccCadet]
    );

    // Get the request ID
    const reqRes = await db.query(
      'SELECT id FROM no_dues_requests WHERE student_pin = $1 ORDER BY id DESC LIMIT 1',
      [pin]
    );
    const requestId = reqRes.rows[0].id;

    // Fetch student's course_branch from students_master
    const studentRes = await db.query('SELECT course_branch FROM students_master WHERE pin = $1', [pin]);
    const studentCourse = (studentRes.rows[0] && studentRes.rows[0].course_branch) || '';

    // Fetch branches to resolve student's branch code (Strictly for 9 Official SVGP Courses)
    const branchesRes = await db.query('SELECT * FROM branches WHERE is_active = 1');
    let studentBranchCode = '';
    const sCourse = studentCourse.toLowerCase();

    // Priority checks for exact match or specific keywords
    if (sCourse.includes('industry integrated') || sCourse.includes('ece-ii')) {
      studentBranchCode = 'ECE-II';
    } else if (sCourse.includes('pharmacy') || sCourse.includes('d.pharma') || sCourse.includes('pharm')) {
      studentBranchCode = 'PHARM';
    } else if (sCourse.includes('sugar') || sCourse.includes('chemical') || sCourse.includes('che')) {
      studentBranchCode = 'CHE';
    } else if (sCourse.includes('biomedical') || sCourse.includes('bme')) {
      studentBranchCode = 'BME';
    } else if (sCourse.includes('computer') || sCourse.includes('cme') || sCourse.includes('cse')) {
      studentBranchCode = 'CME';
    } else if (sCourse.includes('electrical and electronics') || sCourse.includes('eee')) {
      studentBranchCode = 'EEE';
    } else if (sCourse.includes('electronics and communication') || sCourse.includes('ece')) {
      studentBranchCode = 'ECE';
    } else if (sCourse.includes('civil')) {
      studentBranchCode = 'CIVIL';
    } else if (sCourse.includes('mech')) {
      studentBranchCode = 'MECH';
    } else {
      // Direct branch match fallback
      for (const b of branchesRes.rows) {
        if (sCourse === b.name.toLowerCase() || sCourse === b.code.toLowerCase()) {
          studentBranchCode = b.code;
          break;
        }
      }
    }

    // Fetch all active departments
    const deptRes = await db.query(
      'SELECT * FROM departments WHERE is_active = 1 ORDER BY id ASC'
    );

    // Filter departments: Common (ALL) + matching student's branch
    const applicableDepts = deptRes.rows.filter(dept => {
      if (!dept.branch_code || dept.branch_code === 'ALL') return true;
      if (studentBranchCode && dept.branch_code.toUpperCase() === studentBranchCode.toUpperCase()) return true;
      if (studentCourse.toLowerCase().includes(dept.branch_code.toLowerCase())) return true;
      if (dept.name.toLowerCase().includes(studentCourse.toLowerCase()) || studentCourse.toLowerCase().includes(dept.name.toLowerCase())) return true;
      return false;
    });

    // Insert department clearances
    for (const dept of applicableDepts) {
      const isNcc = dept.name.toUpperCase().includes('NSS') || dept.name.toUpperCase().includes('NCC');
      const deptName = (isNcc && isNccCadet === 0) ? `${dept.name} (Non-Cadet)` : dept.name;

      await db.query(
        `INSERT INTO department_clearances 
         (request_id, student_pin, department_id, department_name, status, last_notified_at)
         VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)`,
        [requestId, pin, dept.id, deptName, 'Pending']
      );
    }

    return res.status(201).json({
      success: true,
      message: 'No-Dues request submitted successfully to all departments.',
      requestId,
      is_ncc_cadet: isNccCadet === 1
    });
  } catch (err) {
    console.error('submitNoDuesRequest error:', err);
    return res.status(500).json({ success: false, error: 'Failed to submit No-Dues request.' });
  }
}


async function reNotifyDepartment(req, res) {
  try {
    const pin = req.student.pin;
    const { departmentId } = req.body;

    if (!departmentId) {
      return res.status(400).json({ success: false, error: 'departmentId is required.' });
    }

    // Get current request
    const reqRes = await db.query(
      'SELECT * FROM no_dues_requests WHERE student_pin = $1 ORDER BY id DESC LIMIT 1',
      [pin]
    );

    if (reqRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'No active No-Dues request found.' });
    }

    const clearanceRes = await db.query(
      `SELECT * FROM department_clearances 
       WHERE request_id = $1 AND department_id = $2`,
      [reqRes.rows[0].id, departmentId]
    );

    if (clearanceRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Department clearance entry not found.' });
    }

    const clearance = clearanceRes.rows[0];

    if (clearance.status === 'Approved') {
      return res.status(400).json({ success: false, error: 'This department has already approved clearance.' });
    }

    // Check 20 hours
    if (clearance.last_notified_at) {
      const lastTime = new Date(clearance.last_notified_at).getTime();
      const elapsedHours = (Date.now() - lastTime) / (1000 * 60 * 60);

      if (elapsedHours < 20) {
        const hoursLeft = Math.ceil(20 - elapsedHours);
        return res.status(429).json({
          success: false,
          error: `Re-notification is rate-limited. Please wait ${hoursLeft} more hours before re-notifying this department.`
        });
      }
    }

    // Update last_notified_at
    await db.query(
      'UPDATE department_clearances SET last_notified_at = CURRENT_TIMESTAMP WHERE id = $1',
      [clearance.id]
    );

    return res.json({
      success: true,
      message: `Re-notification sent successfully to ${clearance.department_name} Incharge.`
    });
  } catch (err) {
    console.error('reNotifyDepartment error:', err);
    return res.status(500).json({ success: false, error: 'Failed to send re-notification.' });
  }
}

async function resetNoDuesRequest(req, res) {
  try {
    const pin = req.student.pin;

    // Check if there is an existing request
    const existingReq = await db.query(
      'SELECT * FROM no_dues_requests WHERE LOWER(student_pin) = LOWER($1) ORDER BY id DESC LIMIT 1',
      [pin]
    );

    if (existingReq.rows.length === 0) {
      return res.status(400).json({ success: false, error: 'No active No-Dues request found to reset.' });
    }

    const current = existingReq.rows[0];
    if (current.status === 'Completed') {
      return res.status(400).json({
        success: false,
        error: 'Cannot reset a completed No-Dues request. Please contact the Administrative Clerk.'
      });
    }

    // Delete clearances and dues associated with this request
    await db.query('DELETE FROM department_clearances WHERE request_id = $1', [current.id]);
    await db.query('DELETE FROM dues WHERE LOWER(student_pin) = LOWER($1)', [pin]);
    await db.query('DELETE FROM no_dues_requests WHERE id = $1', [current.id]);

    return res.json({
      success: true,
      message: 'No-Dues application reset successfully. You may now re-declare your NCC/NSS status and submit.'
    });
  } catch (err) {
    console.error('resetNoDuesRequest error:', err);
    return res.status(500).json({ success: false, error: 'Failed to reset No-Dues request.' });
  }
}

module.exports = {
  getStudentDashboard,
  submitNoDuesRequest,
  reNotifyDepartment,
  resetNoDuesRequest
};



