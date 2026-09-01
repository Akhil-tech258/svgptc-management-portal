const db = require('../config/db');
const { comparePassword, generateToken, getTodayFormatted } = require('../utils/helpers');

async function studentRegister(req, res) {
  try {
    const { name, pin, department } = req.body;

    if (!name || !pin || !department) {
      return res.status(400).json({
        success: false,
        error: 'Student Name, PIN, and Department are all mandatory for registration.'
      });
    }

    const cleanPin = pin.trim();
    const cleanName = name.trim();
    const cleanDept = department.trim();

    // 1. Verify existence in students_master
    const masterRes = await db.query(
      'SELECT * FROM students_master WHERE pin = $1',
      [cleanPin]
    );

    if (masterRes.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: `PIN "${cleanPin}" not found in college student master records. Please contact the Clerk.`
      });
    }

    const masterRecord = masterRes.rows[0];

    // 2. Case-insensitive name match
    if (masterRecord.student_name.trim().toLowerCase() !== cleanName.toLowerCase()) {
      return res.status(400).json({
        success: false,
        error: 'Student Name does not match the imported master record for this PIN.'
      });
    }

    // 3. Department / Branch match
    let deptMatches = masterRecord.course_branch.trim().toLowerCase() === cleanDept.toLowerCase();
    if (!deptMatches) {
      // Resolve against branches table
      const branchCheck = await db.query(
        'SELECT * FROM branches WHERE LOWER(code) = $1 OR LOWER(name) = $1',
        [cleanDept.toLowerCase()]
      );
      if (branchCheck.rows.length > 0) {
        const b = branchCheck.rows[0];
        const recBranch = masterRecord.course_branch.trim().toLowerCase();
        if (
          recBranch === b.code.toLowerCase() ||
          recBranch === b.name.toLowerCase() ||
          recBranch.includes(b.code.toLowerCase()) ||
          recBranch.includes(b.name.toLowerCase()) ||
          b.name.toLowerCase().includes(recBranch)
        ) {
          deptMatches = true;
        }
      }
    }

    if (!deptMatches) {
      return res.status(400).json({
        success: false,
        error: `Selected branch does not match master record (${masterRecord.course_branch}).`
      });
    }

    // 4. Check if already registered
    const regCheck = await db.query(
      'SELECT * FROM students_registered WHERE pin = $1',
      [cleanPin]
    );

    if (regCheck.rows.length > 0) {
      // If already registered, return token directly so they can log in
      const token = generateToken({
        role: 'student',
        pin: cleanPin,
        student_name: masterRecord.student_name,
        course_branch: masterRecord.course_branch
      });
      return res.json({
        success: true,
        message: 'Account already registered. Logged in successfully.',
        token,
        student: {
          pin: cleanPin,
          student_name: masterRecord.student_name,
          course_branch: masterRecord.course_branch
        }
      });
    }

    // 5. Insert into students_registered
    await db.query(
      'INSERT INTO students_registered (pin, student_name, course_branch) VALUES ($1, $2, $3)',
      [cleanPin, masterRecord.student_name, masterRecord.course_branch]
    );

    const token = generateToken({
      role: 'student',
      pin: cleanPin,
      student_name: masterRecord.student_name,
      course_branch: masterRecord.course_branch
    });

    return res.status(201).json({
      success: true,
      message: 'Registration successful!',
      token,
      student: {
        pin: cleanPin,
        student_name: masterRecord.student_name,
        course_branch: masterRecord.course_branch
      }
    });
  } catch (err) {
    console.error('Registration error:', err);
    return res.status(500).json({ success: false, error: 'Internal server error during registration.' });
  }
}

async function studentLogin(req, res) {
  try {
    const { name, pin } = req.body;

    if (!name || !pin) {
      return res.status(400).json({
        success: false,
        error: 'Both Student Name and PIN are required for login.'
      });
    }

    const cleanPin = pin.trim();
    const cleanName = name.trim();

    // 1. Check if already registered
    const regRes = await db.query(
      'SELECT * FROM students_registered WHERE LOWER(pin) = LOWER($1)',
      [cleanPin]
    );

    let student = null;

    if (regRes.rows.length > 0) {
      student = regRes.rows[0];
      // Case-insensitive name comparison
      if (student.student_name.trim().toLowerCase() !== cleanName.toLowerCase()) {
        return res.status(400).json({
          success: false,
          error: `Invalid credentials: Name does not match registered student record for PIN "${cleanPin}".`
        });
      }
    } else {
      // 2. Check if student exists in students_master imported by clerk
      const masterRes = await db.query(
        'SELECT * FROM students_master WHERE LOWER(pin) = LOWER($1)',
        [cleanPin]
      );

      if (masterRes.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: `PIN "${cleanPin}" was not found in college master records. Please verify your PIN or contact the Clerk.`
        });
      }

      const master = masterRes.rows[0];

      // Case-insensitive name check against master
      if (master.student_name.trim().toLowerCase() !== cleanName.toLowerCase()) {
        return res.status(400).json({
          success: false,
          error: `Student Name "${cleanName}" does not match the college master record for PIN "${cleanPin}".`
        });
      }

      // Auto-activate registration from master record
      const today = getTodayFormatted();
      await db.query(
        'INSERT INTO students_registered (pin, student_name, course_branch, registered_at) VALUES ($1, $2, $3, $4)',
        [master.pin, master.student_name, master.course_branch, today]
      );

      student = {
        pin: master.pin,
        student_name: master.student_name,
        course_branch: master.course_branch
      };
    }

    const token = generateToken({
      role: 'student',
      pin: student.pin,
      student_name: student.student_name,
      course_branch: student.course_branch
    });

    return res.json({
      success: true,
      message: 'Student login successful',
      token,
      student: {
        pin: student.pin,
        student_name: student.student_name,
        course_branch: student.course_branch
      }
    });
  } catch (err) {
    console.error('Student login error:', err);
    return res.status(500).json({ success: false, error: 'Internal server error during student login.' });
  }
}

async function facultyLogin(req, res) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Username and password are required.'
      });
    }

    const facultyRes = await db.query(
      'SELECT * FROM faculty_accounts WHERE LOWER(username) = LOWER($1) AND is_active = 1',
      [username.trim()]
    );

    if (facultyRes.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials or inactive account.'
      });
    }

    const faculty = facultyRes.rows[0];
    const passwordMatch = comparePassword(password, faculty.password_hash);

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid username or password.'
      });
    }

    const token = generateToken({
      role: 'faculty',
      id: faculty.id,
      username: faculty.username,
      department_id: faculty.department_id,
      department_name: faculty.department_name
    });

    return res.json({
      success: true,
      message: 'Faculty login successful',
      token,
      faculty: {
        id: faculty.id,
        username: faculty.username,
        department_id: faculty.department_id,
        department_name: faculty.department_name
      }
    });
  } catch (err) {
    console.error('Faculty login error:', err);
    return res.status(500).json({ success: false, error: 'Internal server error during faculty login.' });
  }
}

async function clerkLogin(req, res) {
  try {
    let { username, password } = req.body;

    if (!username || !username.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Username is required.'
      });
    }

    if (!password) {
      return res.status(400).json({
        success: false,
        error: 'Password is required.'
      });
    }

    username = username.trim();

    const clerkRes = await db.query(
      'SELECT * FROM clerks WHERE LOWER(username) = LOWER($1)',
      [username]
    );

    if (clerkRes.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Invalid username or password.'
      });
    }

    const clerk = clerkRes.rows[0];


    const passwordMatch = comparePassword(password, clerk.password_hash);

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid username or password.'
      });
    }

    const token = generateToken({
      role: 'clerk',
      id: clerk.id,
      username: clerk.username
    });

    return res.json({
      success: true,
      message: 'Clerk login successful',
      token,
      clerk: { id: clerk.id, username: clerk.username }
    });
  } catch (err) {
    console.error('Clerk login error:', err);
    return res.status(500).json({ success: false, error: 'Internal server error during Clerk login.' });
  }
}

async function getMe(req, res) {
  return res.json({
    success: true,
    user: req.user
  });
}

module.exports = {
  studentRegister,
  studentLogin,
  facultyLogin,
  clerkLogin,
  getMe
};
