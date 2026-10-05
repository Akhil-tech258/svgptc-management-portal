const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const db = require('../config/db');
const facultyController = require('../controllers/facultyController');

function createMockReqRes(body, faculty) {
  const req = {
    body,
    faculty: faculty || { id: 1, username: 'test_faculty_user', department_id: 1, department_name: 'Library' }
  };
  const res = {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    }
  };
  return { req, res };
}

describe('Faculty Batch Clearance Approval & Dues Safety Tests', () => {
  const TEST_PINS = {
    CLEAN_1: 'TEST-BATCH-CLEAN-01',
    CLEAN_2: 'TEST-BATCH-CLEAN-02',
    CLEAN_3: 'TEST-BATCH-CLEAN-03',
    WITH_DUE: 'TEST-BATCH-DUE-01',
    SINGLE: 'TEST-BATCH-SINGLE-01'
  };

  let testDeptId = 1;

  before(async () => {
    await db.initDB();

    // Fetch an active department or create one
    const deptRes = await db.query('SELECT id, name FROM departments WHERE is_active = 1 LIMIT 1');
    if (deptRes.rows.length > 0) {
      testDeptId = deptRes.rows[0].id;
    }

    // Clean up any old test data
    for (const pin of Object.values(TEST_PINS)) {
      await db.query('DELETE FROM dues WHERE LOWER(student_pin) = LOWER($1)', [pin]);
      await db.query('DELETE FROM department_clearances WHERE LOWER(student_pin) = LOWER($1)', [pin]);
      await db.query('DELETE FROM no_dues_requests WHERE LOWER(student_pin) = LOWER($1)', [pin]);
      await db.query('DELETE FROM students_master WHERE LOWER(pin) = LOWER($1)', [pin]);

      // Seed student master record with 1-to-1 indexed parameters
      await db.query(
        `INSERT INTO students_master (pin, admission_no, student_name, father_name, dob, nationality, religion, course_branch, date_of_admission)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [pin, 'ADM-' + pin, 'Test Student ' + pin, 'Test Father', '2000-01-01', 'Indian', 'Hindu', 'Computer Engineering', '2021-06-01']
      );

      // Seed clearance request
      await db.query(
        `INSERT INTO no_dues_requests (student_pin, status, is_ncc_cadet, submitted_at)
         VALUES ($1, $2, $3, CURRENT_TIMESTAMP)`,
        [pin, 'Pending', 0]
      );

      const reqRes = await db.query(
        `SELECT id FROM no_dues_requests WHERE LOWER(student_pin) = LOWER($1) ORDER BY id DESC LIMIT 1`,
        [pin]
      );
      const reqId = reqRes.rows[0].id;

      // Seed department clearance
      await db.query(
        `INSERT INTO department_clearances (request_id, student_pin, department_id, department_name, status)
         VALUES ($1, $2, $3, $4, $5)`,
        [reqId, pin, testDeptId, 'Test Dept', 'Pending']
      );
    }

    // Add an active due for WITH_DUE student
    await db.query(
      `INSERT INTO dues (department_id, student_pin, reason, amount, status, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [testDeptId, TEST_PINS.WITH_DUE, 'Unreturned tool in lab', '150', 'Active', 'test_faculty_user']
    );
  });

  after(async () => {
    // Clean up all seeded test data
    for (const pin of Object.values(TEST_PINS)) {
      await db.query('DELETE FROM dues WHERE LOWER(student_pin) = LOWER($1)', [pin]);
      await db.query('DELETE FROM department_clearances WHERE LOWER(student_pin) = LOWER($1)', [pin]);
      await db.query('DELETE FROM no_dues_requests WHERE LOWER(student_pin) = LOWER($1)', [pin]);
      await db.query('DELETE FROM students_master WHERE LOWER(pin) = LOWER($1)', [pin]);
    }
  });

  test('1. Empty student PIN array is rejected with HTTP 400', async () => {
    const { req, res } = createMockReqRes({ student_pins: [] }, { id: 10, username: 'tester', department_id: testDeptId });
    await facultyController.approveBatchClearance(req, res);

    assert.equal(res.statusCode, 400);
    assert.equal(res.body.success, false);
    assert.match(res.body.error, /non-empty array/i);
  });

  test('2. Missing student_pins payload is rejected with HTTP 400', async () => {
    const { req, res } = createMockReqRes({}, { id: 10, username: 'tester', department_id: testDeptId });
    await facultyController.approveBatchClearance(req, res);

    assert.equal(res.statusCode, 400);
    assert.equal(res.body.success, false);
    assert.match(res.body.error, /non-empty array/i);
  });

  test('3. Student with an active due CANNOT be batch approved (skipped safely)', async () => {
    const { req, res } = createMockReqRes(
      { student_pins: [TEST_PINS.WITH_DUE] },
      { id: 10, username: 'tester', department_id: testDeptId }
    );
    await facultyController.approveBatchClearance(req, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.number_approved, 0);
    assert.equal(res.body.number_skipped, 1);
    assert.equal(res.body.skipped_details[0].pin, TEST_PINS.WITH_DUE);

    // Verify in database that clearance record remains unapproved
    const clearCheck = await db.query(
      'SELECT status FROM department_clearances WHERE LOWER(student_pin) = LOWER($1) AND department_id = $2',
      [TEST_PINS.WITH_DUE, testDeptId]
    );
    assert.notEqual(clearCheck.rows[0].status, 'Approved');
  });

  test('4. Clean student can be batch approved successfully', async () => {
    const { req, res } = createMockReqRes(
      { student_pins: [TEST_PINS.CLEAN_1] },
      { id: 10, username: 'incharge_officer', department_id: testDeptId }
    );
    await facultyController.approveBatchClearance(req, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.number_approved, 1);
    assert.equal(res.body.number_skipped, 0);
    assert.ok(res.body.approved_pins.includes(TEST_PINS.CLEAN_1));

    // Verify in database that clearance record was updated
    const clearCheck = await db.query(
      'SELECT status, approved_by, approved_at FROM department_clearances WHERE LOWER(student_pin) = LOWER($1) AND department_id = $2',
      [TEST_PINS.CLEAN_1, testDeptId]
    );
    assert.equal(clearCheck.rows[0].status, 'Approved');
    assert.equal(clearCheck.rows[0].approved_by, 'incharge_officer');
    assert.ok(clearCheck.rows[0].approved_at);
  });

  test('5. Multiple clean students can be batch approved in a single request', async () => {
    const { req, res } = createMockReqRes(
      { student_pins: [TEST_PINS.CLEAN_2, TEST_PINS.CLEAN_3] },
      { id: 10, username: 'batch_incharge', department_id: testDeptId }
    );
    await facultyController.approveBatchClearance(req, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.number_approved, 2);
    assert.equal(res.body.number_skipped, 0);
    assert.ok(res.body.approved_pins.includes(TEST_PINS.CLEAN_2));
    assert.ok(res.body.approved_pins.includes(TEST_PINS.CLEAN_3));

    // Verify both are Approved in database
    const check2 = await db.query(
      'SELECT status FROM department_clearances WHERE LOWER(student_pin) = LOWER($1) AND department_id = $2',
      [TEST_PINS.CLEAN_2, testDeptId]
    );
    const check3 = await db.query(
      'SELECT status FROM department_clearances WHERE LOWER(student_pin) = LOWER($1) AND department_id = $2',
      [TEST_PINS.CLEAN_3, testDeptId]
    );
    assert.equal(check2.rows[0].status, 'Approved');
    assert.equal(check3.rows[0].status, 'Approved');
  });

  test('6. Faculty department scope is enforced (cannot approve students for another department)', async () => {
    const otherDeptId = 99999; // Non-matching department
    const { req, res } = createMockReqRes(
      { student_pins: [TEST_PINS.SINGLE] },
      { id: 10, username: 'other_incharge', department_id: otherDeptId }
    );
    await facultyController.approveBatchClearance(req, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.number_approved, 0);
    assert.equal(res.body.number_invalid, 1);
    assert.equal(res.body.invalid_details[0].pin, TEST_PINS.SINGLE);

    // Verify clearance was not approved
    const check = await db.query(
      'SELECT status FROM department_clearances WHERE LOWER(student_pin) = LOWER($1) AND department_id = $2',
      [TEST_PINS.SINGLE, testDeptId]
    );
    assert.equal(check.rows[0].status, 'Pending');
  });

  test('7. Existing single-student approval workflow continues to work without regression', async () => {
    // Single approval of clean student
    const { req, res } = createMockReqRes(
      { student_pin: TEST_PINS.SINGLE },
      { id: 10, username: 'single_incharge', department_id: testDeptId }
    );
    await facultyController.approveDepartment(req, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.success, true);

    const check = await db.query(
      'SELECT status, approved_by FROM department_clearances WHERE LOWER(student_pin) = LOWER($1) AND department_id = $2',
      [TEST_PINS.SINGLE, testDeptId]
    );
    assert.equal(check.rows[0].status, 'Approved');
    assert.equal(check.rows[0].approved_by, 'single_incharge');

    // Single approval with active dues must be rejected
    const { req: reqDue, res: resDue } = createMockReqRes(
      { student_pin: TEST_PINS.WITH_DUE },
      { id: 10, username: 'single_incharge', department_id: testDeptId }
    );
    await facultyController.approveDepartment(reqDue, resDue);
    assert.equal(resDue.statusCode, 400);
    assert.equal(resDue.body.success, false);
    assert.match(resDue.body.error, /active dues remain/i);
  });
});
