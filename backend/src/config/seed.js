const db = require('./db');
const { hashPassword } = require('../utils/helpers');

async function seed() {
  console.log('--- Seeding Database ---');
  await db.initDB();

  // 1. Seed SVGP Tirupati Branches (Engineering Diploma + Pharmacy - strictly 9 courses)
  const initialBranches = [
    { code: 'CIVIL', name: 'Civil Engineering' },
    { code: 'MECH', name: 'Mechanical Engineering' },
    { code: 'EEE', name: 'Electrical and Electronics Engineering' },
    { code: 'ECE', name: 'Electronics and Communication Engineering' },
    { code: 'CME', name: 'Computer Engineering' },
    { code: 'BME', name: 'Biomedical Engineering' },
    { code: 'CHE', name: 'Chemical Engineering (Sugar Technology)' },
    { code: 'ECE-II', name: 'Electronics and Communication Engineering (Industry Integrated)' },
    { code: 'PHARM', name: 'Diploma in Pharmacy (D.Pharma)' }
  ];

  for (const b of initialBranches) {
    const existing = await db.query('SELECT id FROM branches WHERE code = $1', [b.code]);
    if (existing.rows.length === 0) {
      await db.query('INSERT INTO branches (code, name, is_active) VALUES ($1, $2, 1)', [b.code, b.name]);
    } else {
      await db.query('UPDATE branches SET name = $1, is_active = 1 WHERE code = $2', [b.name, b.code]);
    }
  }
  console.log('Official 9 SVGP Tirupati branches verified.');

  // 2. Strictly Seed ONLY the 8 Official Common College Departments
  const official8Departments = [
    { name: 'Library', type: 'Physical', branch_code: 'ALL' },
    { name: 'Accounts', type: 'Online', branch_code: 'ALL' },
    { name: 'Scholarship', type: 'Online', branch_code: 'ALL' },
    { name: 'Hostel', type: 'Online', branch_code: 'ALL' },
    { name: 'Physical Director', type: 'Online', branch_code: 'ALL' },
    { name: 'Physics Lab', type: 'Online', branch_code: 'ALL' },
    { name: 'Chemistry Lab', type: 'Online', branch_code: 'ALL' },
    { name: 'NSS/NCC', type: 'Online', branch_code: 'ALL' }
  ];

  // Remove any extra departments not in the 8 official list
  await db.query(`
    DELETE FROM departments 
    WHERE name NOT IN ('Library', 'Accounts', 'Scholarship', 'Hostel', 'Physical Director', 'Physics Lab', 'Chemistry Lab', 'NSS/NCC')
  `);

  for (const dept of official8Departments) {
    const existing = await db.query('SELECT id FROM departments WHERE name = $1', [dept.name]);
    if (existing.rows.length === 0) {
      await db.query('INSERT INTO departments (name, type, branch_code, is_active) VALUES ($1, $2, $3, 1)', [dept.name, dept.type, dept.branch_code]);
    } else {
      await db.query('UPDATE departments SET branch_code = $1, type = $2, is_active = 1 WHERE id = $3', [dept.branch_code, dept.type, existing.rows[0].id]);
    }
  }
  console.log('Official 8 college departments verified (Library is Physical with dedicated Incharge).');


  // 3. Remove old demo clerk accounts if present
  await db.query("DELETE FROM clerks WHERE LOWER(username) IN ('clerk_admin', 'admin')");

  // 4. Seed Pre-registered Clerk from environment variables (supporting both clerk@svgp and clerk)
  const clerkUsername = (process.env.CLERK_USERNAME || 'clerk@svgp').trim();
  const clerkPassword = process.env.CLERK_PASSWORD || 'Clerk@1957';
  const clerkHash = hashPassword(clerkPassword);

  const clerkAliases = [clerkUsername, 'clerk'];
  for (const cUser of clerkAliases) {
    const existingClerk = await db.query('SELECT id FROM clerks WHERE LOWER(username) = LOWER($1)', [cUser]);
    if (existingClerk.rows.length === 0) {
      await db.query('INSERT INTO clerks (username, password_hash) VALUES ($1, $2)', [cUser, clerkHash]);
      console.log(`Pre-registered Clerk account created for username: ${cUser}`);
    } else {
      await db.query('UPDATE clerks SET password_hash = $1 WHERE LOWER(username) = LOWER($2)', [clerkHash, cUser]);
      console.log(`Pre-registered Clerk account verified: ${cUser}`);
    }
  }

  // 5. Seed Pre-registered Librarian Faculty Account (Central Library Department Incharge)
  const libDeptRes = await db.query("SELECT id, name FROM departments WHERE name = 'Library'");
  if (libDeptRes.rows.length > 0) {
    const libDept = libDeptRes.rows[0];
    const librarianUsername = (process.env.LIBRARIAN_USERNAME || 'librarian').trim();
    const librarianPassword = process.env.LIBRARIAN_PASSWORD || 'Lib@1957';
    const libHash = hashPassword(librarianPassword);

    const existingLib = await db.query('SELECT id FROM faculty_accounts WHERE LOWER(username) = LOWER($1)', [librarianUsername]);
    if (existingLib.rows.length === 0) {
      await db.query(
        'INSERT INTO faculty_accounts (username, password_hash, department_id, department_name, branch_code, is_active) VALUES ($1, $2, $3, $4, $5, 1)',
        [librarianUsername, libHash, libDept.id, libDept.name, 'ALL']
      );
      console.log(`Pre-registered Librarian faculty account created: ${librarianUsername}`);
    } else {
      await db.query(
        'UPDATE faculty_accounts SET password_hash = $1, department_id = $2, department_name = $3, branch_code = $4, is_active = 1 WHERE LOWER(username) = LOWER($5)',
        [libHash, libDept.id, libDept.name, 'ALL', librarianUsername]
      );
      console.log(`Pre-registered Librarian faculty account verified: ${librarianUsername}`);
    }
  }

  // 6. Clean up student data only when explicitly requested (e.g. --purge flag or PURGE_ON_SEED=true)
  if (process.env.PURGE_ON_SEED === 'true' || process.argv.includes('--purge')) {
    await db.query('DELETE FROM dues');
    await db.query('DELETE FROM department_clearances');
    await db.query('DELETE FROM no_dues_requests');
    await db.query('DELETE FROM certificate_versions');
    await db.query('DELETE FROM certificate_data');
    await db.query('DELETE FROM students_registered');
    await db.query('DELETE FROM students_master');
    console.log('All student records purged (--purge flag detected). System is clean with 0 students.');
  } else {
    console.log('Existing student data preserved.');
  }

  // 7. Seed Official Demo Students in unsubmitted state for instant portal testing
  const demoStudents = [
    {
      pin: '23018-CM-001',
      admission_no: 'ADM-2023-001',
      student_name: 'Guntaka Yaswanth Kumar',
      father_name: 'Guntaka Ramana',
      dob: '15-06-2005',
      nationality: 'Indian',
      religion: 'Hindu',
      course_branch: 'Computer Engineering',
      date_of_admission: '10-07-2023'
    },
    {
      pin: '24018-CM-812',
      admission_no: 'ADM-2024-812',
      student_name: 'Dileep Kumar',
      father_name: 'Venkata Ramana',
      dob: '10-06-2005',
      nationality: 'Indian',
      religion: 'Hindu',
      course_branch: 'Computer Engineering',
      date_of_admission: '01-07-2024'
    }
  ];

  for (const s of demoStudents) {
    const existingMaster = await db.query('SELECT pin FROM students_master WHERE LOWER(pin) = LOWER($1)', [s.pin]);
    if (existingMaster.rows.length === 0) {
      await db.query(`
        INSERT INTO students_master (
          pin, admission_no, student_name, father_name, dob, nationality, religion, course_branch, date_of_admission
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9
        )
      `, [
        s.pin,
        s.admission_no,
        s.student_name,
        s.father_name,
        s.dob,
        s.nationality,
        s.religion,
        s.course_branch,
        s.date_of_admission
      ]);
      console.log(`Official demo student master record seeded: ${s.pin} (${s.student_name})`);
    }

    const existingReg = await db.query('SELECT pin FROM students_registered WHERE LOWER(pin) = LOWER($1)', [s.pin]);
    if (existingReg.rows.length === 0) {
      await db.query('INSERT INTO students_registered (pin, student_name, course_branch) VALUES ($1, $2, $3)', [
        s.pin,
        s.student_name,
        s.course_branch
      ]);
    }
  }

  console.log('--- Database seeding completed successfully ---');

}

if (require.main === module) {
  seed().then(() => process.exit(0)).catch(err => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = seed;


