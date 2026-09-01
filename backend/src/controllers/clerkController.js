const db = require('../config/db');
const { validateExcelBuffer, generateSampleTemplate } = require('../utils/excelValidator');
const { deriveTNo, hashPassword, getTodayFormatted } = require('../utils/helpers');

// --- Dashboard & Stats ---
async function getClerkDashboard(req, res) {
  try {
    const studentsTotalRes = await db.query('SELECT COUNT(*) as count FROM students_master');
    const studentsRegRes = await db.query('SELECT COUNT(*) as count FROM students_registered');
    const requestsPendingRes = await db.query("SELECT COUNT(*) as count FROM no_dues_requests WHERE status != 'Completed'");
    const requestsCompletedRes = await db.query("SELECT COUNT(*) as count FROM no_dues_requests WHERE status = 'Completed'");
    const totalDuesRes = await db.query("SELECT COUNT(*) as count FROM dues WHERE status = 'Active'");
    const deptsRes = await db.query('SELECT * FROM departments ORDER BY id ASC');
    const facultyRes = await db.query('SELECT id, username, department_id, department_name, is_active, created_at FROM faculty_accounts ORDER BY id ASC');
    const certsGeneratedRes = await db.query('SELECT COUNT(*) as count FROM certificate_versions WHERE is_current = 1');
    const branchesRes = await db.query('SELECT COUNT(*) as count FROM branches WHERE is_active = 1');

    return res.json({
      success: true,
      stats: {
        total_students_master: parseInt(studentsTotalRes.rows[0].count, 10),
        registered_students: parseInt(studentsRegRes.rows[0].count, 10),
        pending_no_dues: parseInt(requestsPendingRes.rows[0].count, 10),
        completed_no_dues: parseInt(requestsCompletedRes.rows[0].count, 10),
        active_dues_college: parseInt(totalDuesRes.rows[0].count, 10),
        certificates_generated: parseInt(certsGeneratedRes.rows[0].count, 10),
        total_departments: deptsRes.rows.length,
        total_faculty: facultyRes.rows.length,
        total_branches: parseInt(branchesRes.rows[0].count, 10)
      },
      departments: deptsRes.rows,
      faculty_accounts: facultyRes.rows
    });
  } catch (err) {
    console.error('getClerkDashboard error:', err);
    return res.status(500).json({ success: false, error: 'Failed to fetch Clerk dashboard.' });
  }
}

// --- Excel Student Master Import ---
async function previewExcelImport(req, res) {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ success: false, error: 'Please upload a valid Excel file (.xlsx or .xls).' });
    }

    // Get existing PINs
    const pinsRes = await db.query('SELECT pin FROM students_master');
    const existingPins = new Set(pinsRes.rows.map(r => r.pin));

    const result = await validateExcelBuffer(req.file.buffer, existingPins);
    if (result.error) {
      return res.status(400).json({ success: false, error: result.error });
    }

    return res.json({
      success: true,
      summary: result.summary,
      validRows: result.validRows,
      rejectedRows: result.rejectedRows
    });
  } catch (err) {
    console.error('previewExcelImport error:', err);
    return res.status(500).json({ success: false, error: 'Error processing Excel file: ' + err.message });
  }
}

async function commitExcelImport(req, res) {
  try {
    const { validRows } = req.body;

    if (!Array.isArray(validRows) || validRows.length === 0) {
      return res.status(400).json({ success: false, error: 'No valid rows provided to commit.' });
    }

    let insertedCount = 0;
    let updatedCount = 0;

    for (const row of validRows) {
      const {
        pin, admission_no, student_name, father_name,
        dob, nationality, religion, course_branch, date_of_admission
      } = row;

      const check = await db.query('SELECT pin FROM students_master WHERE pin = $1', [pin]);

      if (check.rows.length > 0) {
        // Update existing record
        await db.query(
          `UPDATE students_master 
           SET admission_no = $1, student_name = $2, father_name = $3, dob = $4,
               nationality = $5, religion = $6, course_branch = $7, date_of_admission = $8
           WHERE pin = $9`,
          [admission_no, student_name, father_name, dob, nationality, religion, course_branch, date_of_admission, pin]
        );
        updatedCount++;
      } else {
        // Insert new record
        await db.query(
          `INSERT INTO students_master 
           (pin, admission_no, student_name, father_name, dob, nationality, religion, course_branch, date_of_admission)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [pin, admission_no, student_name, father_name, dob, nationality, religion, course_branch, date_of_admission]
        );
        insertedCount++;
      }

      // If optional certificate details were present in the Excel file
      if (row.certificate_data) {
        const cd = row.certificate_data;
        const certCheck = await db.query('SELECT student_pin, is_locked FROM certificate_data WHERE student_pin = $1', [pin]);
        const tNo = deriveTNo(pin);
        if (certCheck.rows.length === 0) {
          await db.query(
            `INSERT INTO certificate_data 
             (student_pin, t_no, date_of_leaving, fees_paid, promotion_status, conduct_character, is_locked)
             VALUES ($1, $2, $3, $4, $5, $6, 0)`,
            [pin, tNo, cd.date_of_leaving || '', cd.fees_paid || 'Yes', cd.promotion_status || '', cd.conduct_character || 'Satisfactory']
          );
        } else if (certCheck.rows[0].is_locked === 0) {
          await db.query(
            `UPDATE certificate_data 
             SET date_of_leaving = COALESCE($1, date_of_leaving),
                 fees_paid = COALESCE($2, fees_paid),
                 promotion_status = COALESCE($3, promotion_status),
                 conduct_character = COALESCE($4, conduct_character)
             WHERE student_pin = $5`,
            [cd.date_of_leaving || null, cd.fees_paid || null, cd.promotion_status || null, cd.conduct_character || null, pin]
          );
        }
      }
    }

    return res.json({
      success: true,
      message: `Successfully imported student master records. Inserted: ${insertedCount}, Updated: ${updatedCount}.`,
      insertedCount,
      updatedCount
    });
  } catch (err) {
    console.error('commitExcelImport error:', err);
    return res.status(500).json({ success: false, error: 'Failed to commit imported student records: ' + err.message });
  }
}

function downloadSampleExcel(req, res) {
  try {
    const buffer = generateSampleTemplate();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="student_master_sample.xlsx"');
    return res.send(buffer);
  } catch (err) {
    console.error('downloadSampleExcel error:', err);
    return res.status(500).json({ success: false, error: 'Failed to generate sample template.' });
  }
}

// --- Faculty Accounts Management ---
async function getFacultyAccounts(req, res) {
  try {
    const result = await db.query(
      `SELECT fa.id, fa.username, fa.department_id, fa.department_name, fa.branch_code, fa.is_active, fa.created_at, 
              d.type as department_type, d.branch_code as dept_branch_code
       FROM faculty_accounts fa
       LEFT JOIN departments d ON d.id = fa.department_id
       ORDER BY fa.id ASC`
    );

    // Normalize branch_code: if null or empty, use 'ALL'
    const formatted = result.rows.map(r => ({
      ...r,
      branch_code: r.branch_code || r.dept_branch_code || 'ALL',
      is_common: (r.branch_code || r.dept_branch_code || 'ALL') === 'ALL'
    }));

    return res.json({ success: true, faculty: formatted });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Failed to fetch faculty accounts.' });
  }
}

async function createFacultyAccount(req, res) {
  try {
    const { username, password, department_id, branch_code } = req.body;

    if (!username || !password || !department_id) {
      return res.status(400).json({ success: false, error: 'Username, password, and department are required.' });
    }

    const cleanUsername = username.trim();

    // Check duplicate username
    const checkUser = await db.query('SELECT id FROM faculty_accounts WHERE username = $1', [cleanUsername]);
    if (checkUser.rows.length > 0) {
      return res.status(400).json({ success: false, error: `Username "${cleanUsername}" is already in use.` });
    }

    // Get department
    const deptRes = await db.query('SELECT * FROM departments WHERE id = $1', [department_id]);
    if (deptRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Selected department not found.' });
    }
    const dept = deptRes.rows[0];
    const targetBranch = (branch_code || dept.branch_code || 'ALL').trim().toUpperCase();

    const hash = hashPassword(password);
    await db.query(
      `INSERT INTO faculty_accounts (username, password_hash, department_id, department_name, branch_code, is_active)
       VALUES ($1, $2, $3, $4, $5, 1)`,
      [cleanUsername, hash, dept.id, dept.name, targetBranch]
    );

    return res.status(201).json({
      success: true,
      message: `Faculty account created successfully for ${dept.name} (${targetBranch}).`
    });
  } catch (err) {
    console.error('createFacultyAccount error:', err);
    return res.status(500).json({ success: false, error: 'Failed to create faculty account.' });
  }
}

async function updateFacultyScope(req, res) {
  try {
    const { id } = req.params;
    const { branch_code } = req.body;

    if (!branch_code) {
      return res.status(400).json({ success: false, error: 'branch_code is required (e.g. ALL, CIVIL, MECH, etc.).' });
    }

    const cleanBranch = branch_code.trim().toUpperCase();

    // Verify faculty exists
    const facRes = await db.query('SELECT * FROM faculty_accounts WHERE id = $1', [id]);
    if (facRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Faculty account not found.' });
    }
    const faculty = facRes.rows[0];

    // Update faculty_accounts
    await db.query(
      'UPDATE faculty_accounts SET branch_code = $1 WHERE id = $2',
      [cleanBranch, id]
    );

    // Also update associated department branch_code if linked
    if (faculty.department_id) {
      await db.query(
        'UPDATE departments SET branch_code = $1 WHERE id = $2',
        [cleanBranch, faculty.department_id]
      );
    }

    const scopeDesc = cleanBranch === 'ALL' ? 'Common (All Branches)' : `Branch-Separated (${cleanBranch})`;
    return res.json({
      success: true,
      message: `Faculty ${faculty.username} scope changed to: ${scopeDesc}`,
      branch_code: cleanBranch,
      is_common: cleanBranch === 'ALL'
    });
  } catch (err) {
    console.error('updateFacultyScope error:', err);
    return res.status(500).json({ success: false, error: 'Failed to update faculty scope.' });
  }
}

async function toggleFacultyStatus(req, res) {
  try {
    const { id } = req.params;
    const { is_active } = req.body;

    await db.query(
      'UPDATE faculty_accounts SET is_active = $1 WHERE id = $2',
      [is_active ? 1 : 0, id]
    );

    return res.json({ success: true, message: 'Faculty account status updated.' });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Failed to update faculty status.' });
  }
}

async function deleteFacultyAccount(req, res) {
  try {
    const { id } = req.params;

    const check = await db.query('SELECT * FROM faculty_accounts WHERE id = $1', [id]);
    if (check.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Faculty account not found.' });
    }

    const fac = check.rows[0];
    await db.query('DELETE FROM faculty_accounts WHERE id = $1', [id]);

    return res.json({
      success: true,
      message: `Faculty account "${fac.username}" (${fac.department_name}) deleted successfully.`
    });
  } catch (err) {
    console.error('deleteFacultyAccount error:', err);
    return res.status(500).json({ success: false, error: 'Failed to delete faculty account.' });
  }
}

async function resetFacultyPassword(req, res) {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 4) {
      return res.status(400).json({ success: false, error: 'New password must be at least 4 characters.' });
    }

    const hash = hashPassword(newPassword);
    await db.query(
      'UPDATE faculty_accounts SET password_hash = $1 WHERE id = $2',
      [hash, id]
    );

    return res.json({ success: true, message: 'Faculty password reset successfully.' });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Failed to reset faculty password.' });
  }
}

// --- Branch / Course Management ---
async function getBranches(req, res) {
  try {
    const result = await db.query('SELECT * FROM branches ORDER BY id ASC');
    return res.json({ success: true, branches: result.rows });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Failed to fetch branches.' });
  }
}

async function createBranch(req, res) {
  try {
    const { code, name } = req.body;
    if (!code || !name) {
      return res.status(400).json({ success: false, error: 'Branch code and name are required.' });
    }
    const cleanCode = code.trim().toUpperCase();
    const cleanName = name.trim();

    await db.query(
      'INSERT INTO branches (code, name, is_active) VALUES ($1, $2, 1)',
      [cleanCode, cleanName]
    );

    return res.status(201).json({ success: true, message: `Branch "${cleanName}" (${cleanCode}) created.` });
  } catch (err) {
    console.error('createBranch error:', err);
    return res.status(500).json({ success: false, error: 'Failed to create branch. Code or name may already exist.' });
  }
}

async function toggleBranchStatus(req, res) {
  try {
    const { id } = req.params;
    const { is_active } = req.body;

    await db.query(
      'UPDATE branches SET is_active = $1 WHERE id = $2',
      [is_active ? 1 : 0, id]
    );

    return res.json({ success: true, message: 'Branch status updated.' });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Failed to update branch status.' });
  }
}

async function deleteBranch(req, res) {
  try {
    const { id } = req.params;
    const check = await db.query('SELECT * FROM branches WHERE id = $1 OR UPPER(code) = UPPER($1)', [id]);
    if (check.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Branch not found.' });
    }
    const branch = check.rows[0];
    await db.query('DELETE FROM branches WHERE id = $1', [branch.id]);
    return res.json({ success: true, message: `Branch "${branch.name}" (${branch.code}) deleted successfully.` });
  } catch (err) {
    console.error('deleteBranch error:', err);
    return res.status(500).json({ success: false, error: 'Failed to delete branch.' });
  }
}


// --- Department Management & Physical Approvals ---
async function getDepartments(req, res) {
  try {
    const result = await db.query('SELECT * FROM departments ORDER BY id ASC');
    return res.json({ success: true, departments: result.rows });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Failed to fetch departments.' });
  }
}

async function createDepartment(req, res) {
  try {
    const { name, type, branch_code } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: 'Department name is required.' });
    }

    const cleanName = name.trim();
    const deptType = type === 'Physical' ? 'Physical' : 'Online';
    const cleanBranch = (branch_code || 'ALL').trim().toUpperCase();

    await db.query(
      'INSERT INTO departments (name, type, branch_code, is_active) VALUES ($1, $2, $3, 1)',
      [cleanName, deptType, cleanBranch]
    );

    return res.status(201).json({ success: true, message: `Department "${cleanName}" created for ${cleanBranch === 'ALL' ? 'All Branches' : cleanBranch}.` });
  } catch (err) {
    console.error('createDepartment error:', err);
    return res.status(500).json({ success: false, error: 'Failed to create department. Name may already exist.' });
  }
}

async function updateDepartment(req, res) {
  try {
    const { id } = req.params;
    const { name, type, branch_code, is_active } = req.body;

    const cleanBranch = (branch_code || 'ALL').trim().toUpperCase();

    await db.query(
      'UPDATE departments SET name = $1, type = $2, branch_code = $3, is_active = $4 WHERE id = $5',
      [name.trim(), type, cleanBranch, is_active ? 1 : 0, id]
    );

    return res.json({ success: true, message: 'Department updated successfully.' });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Failed to update department.' });
  }
}

async function deleteDepartment(req, res) {
  try {
    const { id } = req.params;

    const check = await db.query('SELECT * FROM departments WHERE id = $1', [id]);
    if (check.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Department not found.' });
    }

    const dept = check.rows[0];

    // Delete associated faculty accounts for this department
    await db.query('DELETE FROM faculty_accounts WHERE department_id = $1', [id]);
    await db.query('DELETE FROM dues WHERE department_id = $1', [id]);
    await db.query('DELETE FROM department_clearances WHERE department_id = $1', [id]);

    // Delete department itself
    await db.query('DELETE FROM departments WHERE id = $1', [id]);

    return res.json({
      success: true,
      message: `Department "${dept.name}" and any associated incharge accounts have been deleted.`
    });
  } catch (err) {
    console.error('deleteDepartment error:', err);
    return res.status(500).json({ success: false, error: 'Failed to delete department.' });
  }
}


async function recordPhysicalApproval(req, res) {
  try {
    const { student_pin, department_id } = req.body;

    if (!student_pin || !department_id) {
      return res.status(400).json({ success: false, error: 'student_pin and department_id are required.' });
    }

    const cleanPin = student_pin.trim();
    const deptId = parseInt(department_id, 10);

    // Verify department exists
    const deptRes = await db.query('SELECT * FROM departments WHERE id = $1', [deptId]);
    if (deptRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Department not found.' });
    }

    // Approve physical clearance
    await db.query(
      `UPDATE department_clearances 
       SET status = 'Approved', approved_by = $1, approved_at = CURRENT_TIMESTAMP 
       WHERE LOWER(student_pin) = LOWER($2) AND department_id = $3`,
      ['Clerk (Physical Approval)', cleanPin, deptId]
    );


    // Check if all clearances for student are approved
    const pendingRes = await db.query(
      `SELECT COUNT(*) as count FROM department_clearances WHERE LOWER(student_pin) = LOWER($1) AND status != 'Approved'`,
      [cleanPin]
    );

    const pendingCount = parseInt(pendingRes.rows[0].count, 10);
    if (pendingCount === 0) {
      await db.query(
        `UPDATE no_dues_requests SET status = 'Completed', completed_at = CURRENT_TIMESTAMP WHERE LOWER(student_pin) = LOWER($1)`,
        [cleanPin]
      );
    }

    return res.json({
      success: true,
      message: `Physical clearance for ${deptRes.rows[0].name} recorded successfully for student ${cleanPin}.`,
      allCompleted: pendingCount === 0
    });
  } catch (err) {
    console.error('recordPhysicalApproval error:', err);
    return res.status(500).json({ success: false, error: 'Failed to record physical approval.' });
  }
}

// --- Certificate Verification & Generation ---
async function getCertificateStudents(req, res) {
  try {
    // Fetch all students who have completed No-Dues or are registered
    const result = await db.query(`
      SELECT 
        sm.pin, sm.admission_no, sm.student_name, sm.father_name, sm.dob,
        sm.nationality, sm.religion, sm.course_branch, sm.date_of_admission,
        ndr.status as no_dues_status,
        ndr.completed_at as no_dues_completed_at,
        cd.t_no, cd.date_of_leaving, cd.fees_paid, cd.promotion_status, cd.conduct_character,
        cd.is_locked, cd.verified_by, cd.verified_at,
        cv.version_number as current_version,
        cv.generated_date
      FROM students_master sm
      LEFT JOIN no_dues_requests ndr ON LOWER(ndr.student_pin) = LOWER(sm.pin) AND ndr.status = 'Completed'
      LEFT JOIN certificate_data cd ON LOWER(cd.student_pin) = LOWER(sm.pin)
      LEFT JOIN certificate_versions cv ON LOWER(cv.student_pin) = LOWER(sm.pin) AND cv.is_current = 1
      ORDER BY sm.student_name ASC
    `);

    return res.json({ success: true, students: result.rows });
  } catch (err) {
    console.error('getCertificateStudents error:', err);
    return res.status(500).json({ success: false, error: 'Failed to fetch students for certificates.' });
  }
}

async function updateCertificateData(req, res) {
  try {
    const {
      student_pin, date_of_leaving, fees_paid,
      promotion_status, conduct_character
    } = req.body;

    if (!student_pin) {
      return res.status(400).json({ success: false, error: 'student_pin is required.' });
    }

    const cleanPin = student_pin.trim();

    // Check if currently locked
    const existing = await db.query('SELECT * FROM certificate_data WHERE LOWER(student_pin) = LOWER($1)', [cleanPin]);
    if (existing.rows.length > 0 && existing.rows[0].is_locked === 1) {
      return res.status(400).json({
        success: false,
        error: 'Certificate data is locked. You must explicitly unlock it to make modifications.'
      });
    }

    const t_no = deriveTNo(cleanPin);

    if (existing.rows.length > 0) {
      await db.query(
        `UPDATE certificate_data 
         SET t_no = $1, date_of_leaving = $2, fees_paid = $3,
             promotion_status = $4, conduct_character = $5, updated_at = CURRENT_TIMESTAMP
         WHERE LOWER(student_pin) = LOWER($6)`,
        [t_no, date_of_leaving || '', fees_paid || 'No', promotion_status || '', conduct_character || 'Good', cleanPin]
      );
    } else {
      await db.query(
        `INSERT INTO certificate_data 
         (student_pin, t_no, date_of_leaving, fees_paid, promotion_status, conduct_character, is_locked)
         VALUES ($1, $2, $3, $4, $5, $6, 0)`,
        [cleanPin, t_no, date_of_leaving || '', fees_paid || 'No', promotion_status || '', conduct_character || 'Good']
      );
    }

    return res.json({ success: true, message: 'Certificate data saved successfully.' });
  } catch (err) {
    console.error('updateCertificateData error:', err);
    return res.status(500).json({ success: false, error: 'Failed to save certificate data.' });
  }
}

async function verifyAndLockCertificate(req, res) {
  try {
    const { student_pin } = req.body;
    if (!student_pin) {
      return res.status(400).json({ success: false, error: 'student_pin is required.' });
    }

    const cleanPin = student_pin.trim();

    // Verify No-Dues is completed
    const ndrRes = await db.query("SELECT * FROM no_dues_requests WHERE LOWER(student_pin) = LOWER($1) AND status = 'Completed'", [cleanPin]);
    if (ndrRes.rows.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot verify certificate: Student No-Dues clearance is not completed yet.'
      });
    }

    // Check certificate data exists
    const certRes = await db.query('SELECT * FROM certificate_data WHERE LOWER(student_pin) = LOWER($1)', [cleanPin]);
    if (certRes.rows.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Certificate data is not entered yet. Please fill in Date of Leaving, Fees Paid, and Promotion Status.'
      });
    }

    const cert = certRes.rows[0];
    if (!cert.date_of_leaving || !cert.date_of_leaving.trim()) {
      return res.status(400).json({ success: false, error: 'Date of Leaving is required before final verification.' });
    }
    if (!cert.promotion_status || !cert.promotion_status.trim()) {
      return res.status(400).json({ success: false, error: 'Promotion/Qualification status is required before final verification.' });
    }

    await db.query(
      `UPDATE certificate_data 
       SET is_locked = 1, verified_by = $1, verified_at = CURRENT_TIMESTAMP 
       WHERE LOWER(student_pin) = LOWER($2)`,
      [req.user.username, cleanPin]
    );

    return res.json({
      success: true,
      message: 'Certificate data has been verified and locked. Ready for certificate generation.'
    });
  } catch (err) {
    console.error('verifyAndLockCertificate error:', err);
    return res.status(500).json({ success: false, error: 'Failed to verify and lock certificate data.' });
  }
}

async function unlockCertificate(req, res) {
  try {
    const { student_pin } = req.body;
    if (!student_pin) {
      return res.status(400).json({ success: false, error: 'student_pin is required.' });
    }

    const cleanPin = student_pin.trim();

    await db.query(
      `UPDATE certificate_data 
       SET is_locked = 0, verified_by = NULL, verified_at = NULL 
       WHERE LOWER(student_pin) = LOWER($1)`,
      [cleanPin]
    );

    return res.json({
      success: true,
      message: 'Certificate data unlocked. You may edit fields, but must verify & lock again before generating new version.'
    });
  } catch (err) {
    console.error('unlockCertificate error:', err);
    return res.status(500).json({ success: false, error: 'Failed to unlock certificate data.' });
  }
}

async function generateCertificate(req, res) {
  try {
    const { student_pin } = req.body;
    if (!student_pin) {
      return res.status(400).json({ success: false, error: 'student_pin is required.' });
    }

    const cleanPin = student_pin.trim();

    // Verify student master
    const masterRes = await db.query('SELECT * FROM students_master WHERE LOWER(pin) = LOWER($1)', [cleanPin]);
    if (masterRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Student master record not found.' });
    }
    const student = masterRes.rows[0];

    // Verify certificate data is locked
    const certRes = await db.query('SELECT * FROM certificate_data WHERE LOWER(student_pin) = LOWER($1)', [cleanPin]);
    if (certRes.rows.length === 0 || certRes.rows[0].is_locked !== 1) {
      return res.status(400).json({
        success: false,
        error: 'Certificate data must be Final-Verified and Locked by the Clerk before generation.'
      });
    }
    const certData = certRes.rows[0];

    // Determine new version number
    const prevVersions = await db.query(
      'SELECT version_number FROM certificate_versions WHERE LOWER(student_pin) = LOWER($1) ORDER BY version_number DESC LIMIT 1',
      [cleanPin]
    );

    let nextVersion = 1;
    if (prevVersions.rows.length > 0) {
      nextVersion = prevVersions.rows[0].version_number + 1;
      // Mark older versions as superseded (is_current = 0)
      await db.query(
        'UPDATE certificate_versions SET is_current = 0 WHERE LOWER(student_pin) = LOWER($1)',
        [cleanPin]
      );
    }

    const t_no = certData.t_no || deriveTNo(cleanPin);
    const todayFormatted = getTodayFormatted();

    await db.query(
      `INSERT INTO certificate_versions (
        student_pin, version_number, t_no, student_name, father_name, dob,
        nationality, religion, course_branch, admission_no, date_of_admission,
        date_of_leaving, fees_paid, promotion_status, conduct_character,
        generated_date, generated_by, is_current
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, 1
      )`,
      [
        cleanPin,
        nextVersion,
        t_no,
        student.student_name,
        student.father_name,
        student.dob,
        student.nationality,
        student.religion,
        student.course_branch,
        student.admission_no,
        student.date_of_admission,
        certData.date_of_leaving,
        certData.fees_paid,
        certData.promotion_status,
        certData.conduct_character,
        todayFormatted,
        req.user.username
      ]
    );

    return res.status(201).json({
      success: true,
      message: `Certificate version v${nextVersion} generated successfully.`,
      version: nextVersion,
      generated_date: todayFormatted
    });
  } catch (err) {
    console.error('generateCertificate error:', err);
    return res.status(500).json({ success: false, error: 'Failed to generate certificate: ' + err.message });
  }
}

async function getCertificateAuditHistory(req, res) {
  try {
    const { student_pin } = req.params;
    const historyRes = await db.query(
      `SELECT * FROM certificate_versions WHERE LOWER(student_pin) = LOWER($1) ORDER BY version_number DESC`,
      [student_pin.trim()]
    );
    return res.json({ success: true, history: historyRes.rows });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Failed to fetch certificate audit history.' });
  }
}


// --- Student Master Management & Search ---
async function getStudentsMaster(req, res) {
  try {
    const search = (req.query.search || '').trim().toLowerCase();
    let query = `
      SELECT sm.*, 
             sr.registered_at, 
             cd.is_locked, 
             cd.t_no,
             ndr.status as no_dues_status
      FROM students_master sm
      LEFT JOIN students_registered sr ON sm.pin = sr.pin
      LEFT JOIN certificate_data cd ON sm.pin = cd.student_pin
      LEFT JOIN (
        SELECT r1.student_pin, r1.status 
        FROM no_dues_requests r1
        INNER JOIN (
          SELECT student_pin, MAX(id) as max_id 
          FROM no_dues_requests 
          GROUP BY student_pin
        ) r2 ON r1.id = r2.max_id
      ) ndr ON sm.pin = ndr.student_pin
    `;
    const params = [];

    if (search) {
      query += ` WHERE LOWER(sm.pin) LIKE $1 OR LOWER(sm.student_name) LIKE $1 OR LOWER(sm.admission_no) LIKE $1 OR LOWER(sm.course_branch) LIKE $1`;
      params.push(`%${search}%`);
    }

    query += ` ORDER BY sm.created_at DESC, sm.pin ASC LIMIT 150`;

    const result = await db.query(query, params);
    return res.json({ success: true, students: result.rows });
  } catch (err) {
    console.error('getStudentsMaster error:', err);
    return res.status(500).json({ success: false, error: 'Failed to search students: ' + err.message });
  }
}

async function createSingleStudent(req, res) {
  try {
    let {
      pin,
      admission_no,
      student_name,
      father_name,
      dob,
      nationality,
      religion,
      course_branch,
      date_of_admission
    } = req.body;

    pin = (pin || '').trim();
    student_name = (student_name || '').trim();
    father_name = (father_name || '').trim();
    dob = (dob || '').trim();
    course_branch = (course_branch || '').trim();
    date_of_admission = (date_of_admission || '').trim();
    nationality = (nationality || 'Indian').trim();
    religion = (religion || 'Hindu').trim();
    admission_no = (admission_no || '').trim() || `ADM-${pin}`;

    if (!pin || !student_name || !father_name || !dob || !course_branch || !date_of_admission) {
      return res.status(400).json({
        success: false,
        error: 'Mandatory fields missing: PIN, Student Name, Father Name, DOB, Course/Branch, and Date of Admission are required.'
      });
    }

    // Validate date format DD-MM-YYYY
    const dateRegex = /^(\d{2})-(\d{2})-(\d{4})$/;
    if (!dateRegex.test(dob)) {
      return res.status(400).json({ success: false, error: 'DOB must be in DD-MM-YYYY format (e.g. 15-08-2005).' });
    }
    if (!dateRegex.test(date_of_admission)) {
      return res.status(400).json({ success: false, error: 'Date of Admission must be in DD-MM-YYYY format (e.g. 01-07-2023).' });
    }

    // Check duplicate PIN
    const existing = await db.query('SELECT pin FROM students_master WHERE LOWER(pin) = LOWER($1)', [pin]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ success: false, error: `Student with PIN "${pin}" already exists in Master Records.` });
    }

    await db.query(
      `INSERT INTO students_master 
       (pin, admission_no, student_name, father_name, dob, nationality, religion, course_branch, date_of_admission)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [pin, admission_no, student_name, father_name, dob, nationality, religion, course_branch, date_of_admission]
    );

    return res.status(201).json({
      success: true,
      message: `Student ${student_name} (${pin}) enrolled successfully.`,
      student: { pin, admission_no, student_name, course_branch }
    });
  } catch (err) {
    console.error('createSingleStudent error:', err);
    return res.status(500).json({ success: false, error: 'Failed to add student: ' + err.message });
  }
}

async function updateStudentMaster(req, res) {
  try {
    const targetPin = (req.params.pin || '').trim();
    let {
      admission_no,
      student_name,
      father_name,
      dob,
      nationality,
      religion,
      course_branch,
      date_of_admission
    } = req.body;

    student_name = (student_name || '').trim();
    father_name = (father_name || '').trim();
    dob = (dob || '').trim();
    course_branch = (course_branch || '').trim();
    date_of_admission = (date_of_admission || '').trim();
    nationality = (nationality || 'Indian').trim();
    religion = (religion || 'Hindu').trim();
    admission_no = (admission_no || '').trim() || `ADM-${targetPin}`;

    if (!student_name || !father_name || !dob || !course_branch || !date_of_admission) {
      return res.status(400).json({
        success: false,
        error: 'Mandatory fields missing: Student Name, Father Name, DOB, Course/Branch, and Date of Admission are required.'
      });
    }

    // Validate dates
    const dateRegex = /^(\d{2})-(\d{2})-(\d{4})$/;
    if (!dateRegex.test(dob)) {
      return res.status(400).json({ success: false, error: 'DOB must be in DD-MM-YYYY format (e.g. 15-08-2005).' });
    }
    if (!dateRegex.test(date_of_admission)) {
      return res.status(400).json({ success: false, error: 'Date of Admission must be in DD-MM-YYYY format (e.g. 01-07-2023).' });
    }

    const check = await db.query('SELECT pin FROM students_master WHERE LOWER(pin) = LOWER($1)', [targetPin]);
    if (check.rows.length === 0) {
      return res.status(404).json({ success: false, error: `Student with PIN "${targetPin}" not found.` });
    }

    // Update students_master
    await db.query(
      `UPDATE students_master 
       SET admission_no = $1, student_name = $2, father_name = $3, dob = $4,
           nationality = $5, religion = $6, course_branch = $7, date_of_admission = $8
       WHERE LOWER(pin) = LOWER($9)`,
      [admission_no, student_name, father_name, dob, nationality, religion, course_branch, date_of_admission, targetPin]
    );

    // If student has already registered, update registered record in sync
    await db.query(
      `UPDATE students_registered 
       SET student_name = $1, course_branch = $2
       WHERE LOWER(pin) = LOWER($3)`,
      [student_name, course_branch, targetPin]
    );

    return res.json({
      success: true,
      message: `Student master data for ${targetPin} updated successfully.`
    });
  } catch (err) {
    console.error('updateStudentMaster error:', err);
    return res.status(500).json({ success: false, error: 'Failed to update student: ' + err.message });
  }
}

async function deleteSingleStudent(req, res) {
  try {
    const pin = (req.params.pin || '').trim();
    if (!pin) {
      return res.status(400).json({ success: false, error: 'Student PIN is required.' });
    }

    const check = await db.query('SELECT pin, student_name FROM students_master WHERE LOWER(pin) = LOWER($1)', [pin]);
    if (check.rows.length === 0) {
      return res.status(404).json({ success: false, error: `Student with PIN "${pin}" not found.` });
    }
    const student = check.rows[0];

    // Clean up all related student records
    await db.query('DELETE FROM certificate_versions WHERE LOWER(student_pin) = LOWER($1)', [pin]);
    await db.query('DELETE FROM certificate_data WHERE LOWER(student_pin) = LOWER($1)', [pin]);
    await db.query('DELETE FROM dues WHERE LOWER(student_pin) = LOWER($1)', [pin]);
    await db.query('DELETE FROM department_clearances WHERE LOWER(student_pin) = LOWER($1)', [pin]);
    await db.query('DELETE FROM no_dues_requests WHERE LOWER(student_pin) = LOWER($1)', [pin]);
    await db.query('DELETE FROM students_registered WHERE LOWER(pin) = LOWER($1)', [pin]);
    await db.query('DELETE FROM students_master WHERE LOWER(pin) = LOWER($1)', [pin]);

    return res.json({
      success: true,
      message: `Student "${student.student_name}" (${pin}) and all associated clearance records have been deleted.`
    });
  } catch (err) {
    console.error('deleteSingleStudent error:', err);
    return res.status(500).json({ success: false, error: 'Failed to delete student: ' + err.message });
  }
}

async function purgeAllStudents(req, res) {
  try {
    // Delete all records from all student-related tables
    await db.query('DELETE FROM certificate_versions');
    await db.query('DELETE FROM certificate_data');
    await db.query('DELETE FROM dues');
    await db.query('DELETE FROM department_clearances');
    await db.query('DELETE FROM no_dues_requests');
    await db.query('DELETE FROM students_registered');
    await db.query('DELETE FROM students_master');

    return res.json({
      success: true,
      message: 'All student master records, accounts, dues, clearances, and certificates have been completely purged.'
    });
  } catch (err) {
    console.error('purgeAllStudents error:', err);
    return res.status(500).json({ success: false, error: 'Failed to purge student data: ' + err.message });
  }
}


// Fast-Track Demo Simulator: Approve All Clearances for a Student
async function fastTrackApproveStudent(req, res) {
  try {
    const { pin } = req.params;
    if (!pin) {
      return res.status(400).json({ success: false, error: 'Student PIN is required.' });
    }
    const cleanPin = pin.trim();

    // Check if request exists
    const ndrRes = await db.query('SELECT * FROM no_dues_requests WHERE student_pin = $1', [cleanPin]);
    if (ndrRes.rows.length === 0) {
      return res.status(400).json({
        success: false,
        error: `Student ${cleanPin} has not submitted a No-Dues clearance request yet. Please submit the request first from the Student Portal.`
      });
    }

    const today = getTodayFormatted();

    // 1. Approve all pending department clearances
    await db.query(
      `UPDATE department_clearances 
       SET status = 'Approved', approved_at = $1, approved_by = $2 
       WHERE student_pin = $3`,
      [today, (req.user && req.user.username) || 'Clerk Admin', cleanPin]
    );


    // 2. Clear any active dues
    await db.query(
      `UPDATE dues SET status = 'Cleared' WHERE student_pin = $1 AND status = 'Active'`,
      [cleanPin]
    );

    // 3. Mark No-Dues request as Completed
    await db.query(
      `UPDATE no_dues_requests SET status = 'Completed', completed_at = CURRENT_TIMESTAMP WHERE student_pin = $1`,
      [cleanPin]
    );

    // 4. Pre-fill certificate data if not already set
    const certRes = await db.query('SELECT * FROM certificate_data WHERE student_pin = $1', [cleanPin]);
    const t_no = deriveTNo(cleanPin);
    if (certRes.rows.length === 0) {
      const studentRes = await db.query('SELECT course_branch FROM students_master WHERE pin = $1', [cleanPin]);
      const branch = (studentRes.rows[0] && studentRes.rows[0].course_branch) || 'Diploma';
      await db.query(
        `INSERT INTO certificate_data 
         (student_pin, t_no, date_of_leaving, fees_paid, promotion_status, conduct_character, is_locked)
         VALUES ($1, $2, $3, $4, $5, $6, 0)`,
        [cleanPin, t_no, 'May 2026', 'Yes', `Qualified for award of ${branch}`, 'Good']
      );
    }

    return res.json({
      success: true,
      message: `All department & lab clearances for student ${cleanPin} have been approved!`
    });
  } catch (err) {
    console.error('fastTrackApproveStudent error:', err);
    return res.status(500).json({ success: false, error: 'Failed to fast-track clearances: ' + err.message });
  }
}

module.exports = {
  getClerkDashboard,
  getStudentsMaster,
  createSingleStudent,
  updateStudentMaster,
  deleteSingleStudent,
  purgeAllStudents,
  previewExcelImport,

  commitExcelImport,
  downloadSampleExcel,
  getFacultyAccounts,
  createFacultyAccount,
  updateFacultyScope,
  toggleFacultyStatus,
  deleteFacultyAccount,
  resetFacultyPassword,
  getBranches,
  createBranch,
  toggleBranchStatus,
  deleteBranch,
  getDepartments,

  createDepartment,
  updateDepartment,
  deleteDepartment,
  recordPhysicalApproval,
  getCertificateStudents,
  updateCertificateData,
  verifyAndLockCertificate,
  unlockCertificate,
  generateCertificate,
  getCertificateAuditHistory,
  fastTrackApproveStudent
};
