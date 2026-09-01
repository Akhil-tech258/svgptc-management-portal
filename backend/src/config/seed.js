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

  // 2. Clear ALL pre-existing faculty/lab incharge accounts (Zero initial faculty accounts)
  await db.query('DELETE FROM faculty_accounts');
  console.log('All pre-existing faculty accounts purged. Clerk will create them as needed.');

  // 3. Strictly Seed ONLY the 8 Official Common College Departments
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
  console.log('Official 8 college departments verified.');


  // 3. Remove old demo clerk accounts if present
  await db.query("DELETE FROM clerks WHERE LOWER(username) IN ('clerk_admin', 'admin')");

  // 4. Seed Pre-registered Clerk from environment variables
  const clerkUsername = (process.env.CLERK_USERNAME || 'clerk@svgp').trim();
  const clerkPassword = process.env.CLERK_PASSWORD || 'Clerk@1957';

  const existingClerk = await db.query('SELECT id FROM clerks WHERE LOWER(username) = LOWER($1)', [clerkUsername]);
  if (existingClerk.rows.length === 0) {
    const hash = hashPassword(clerkPassword);
    await db.query('INSERT INTO clerks (username, password_hash) VALUES ($1, $2)', [clerkUsername, hash]);
    console.log(`Pre-registered Clerk account created for username: ${clerkUsername}`);
  } else {
    const hash = hashPassword(clerkPassword);
    await db.query('UPDATE clerks SET password_hash = $1 WHERE LOWER(username) = LOWER($2)', [hash, clerkUsername]);
    console.log(`Pre-registered Clerk account verified: ${clerkUsername}`);
  }

  // 5. Clean up ALL student data completely (Master records, registrations, clearances, dues, certs)
  await db.query('DELETE FROM dues');
  await db.query('DELETE FROM department_clearances');
  await db.query('DELETE FROM no_dues_requests');
  await db.query('DELETE FROM certificate_versions');
  await db.query('DELETE FROM certificate_data');
  await db.query('DELETE FROM students_registered');
  await db.query('DELETE FROM students_master');
  console.log('All student records purged. System is clean with 0 students.');

  console.log('--- Database seeding completed successfully ---');

}

if (require.main === module) {
  seed().then(() => process.exit(0)).catch(err => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = seed;


