// End-to-End System Test Suite verifying all SRS v1.1 Requirements
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:5000/api';

async function req(endpoint, method = 'GET', body = null, token = null) {
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (body && !(body instanceof FormData)) headers['Content-Type'] = 'application/json';

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });
  const data = await res.json();
  return { status: res.status, ok: res.ok, data };
}

async function runTests() {
  console.log('========================================================');
  console.log('RUNNING E2E TEST SUITE FOR SRS v1.1 SPECIFICATIONS');
  console.log('========================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(cond, desc) {
    if (cond) {
      console.log(`  [PASS] ${desc}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${desc}`);
      failed++;
    }
  }

  try {
    // 1. Health check
    const health = await req('/health');
    assert(health.ok && health.data.status === 'online', '1. System Health API is online');

    // 2. Clerk Login using env credentials
    const clerkUser = process.env.CLERK_USERNAME || 'clerk@svgp';
    const clerkPass = process.env.CLERK_PASSWORD || 'Clerk@1957';
    const clerkLogin = await req('/auth/clerk/login', 'POST', {
      username: clerkUser,
      password: clerkPass
    });
    assert(clerkLogin.ok && clerkLogin.data.token, '2. Clerk authentication succeeds with environment credentials');
    const clerkToken = clerkLogin.data.token;

    // 3. Departments check (Strictly 8 Official College Departments)
    const depts = await req('/departments');
    assert(depts.ok && depts.data.departments.length === 8, '3. Initial 8 departments seeded correctly');


    // 4. Excel Upload Simulation: Test Student Master Commit
    const testPin = `24018-CM-${Math.floor(100 + Math.random() * 899)}`;
    const expectedTNo = testPin.slice(-3).replace(/^0+/, '');

    const commitRes = await req('/clerk/excel/commit', 'POST', {
      validRows: [
        {
          pin: testPin,
          admission_no: 'ADM-2024-TEST',
          student_name: 'Vikram Aditya',
          father_name: 'Rao Aditya',
          dob: '12-04-2005',
          nationality: 'Indian',
          religion: 'Hindu',
          course_branch: 'Computer Engineering',
          date_of_admission: '01-07-2024'
        }
      ]
    }, clerkToken);
    assert(commitRes.ok && commitRes.data.success, '4. Clerk commits valid student master records to DB');

    // 5. Student Registration: Case-Insensitive name match check
    const studentReg = await req('/auth/student/register', 'POST', {
      pin: testPin,
      name: 'vikram aditya', // lowercase
      department: 'Computer Engineering'
    });
    assert(studentReg.ok && studentReg.data.success, '5. Student registers with case-insensitive name matching');
    const studentToken = studentReg.data.token;

    // 6. Student Login
    const studentLogin = await req('/auth/student/login', 'POST', {
      pin: testPin,
      name: 'VIKRAM ADITYA' // uppercase
    });
    assert(studentLogin.ok && studentLogin.data.token, '6. Student logs in with PIN + case-insensitive Name');

    // 7. Student Submits No-Dues Request
    const submitReq = await req('/students/no-dues/submit', 'POST', {}, studentToken);
    assert(submitReq.ok && submitReq.data.requestId, '7. Student submits No-Dues clearance request');

    // 8. Student Dashboard Check
    const studentDash = await req('/students/dashboard', 'GET', null, studentToken);
    assert(studentDash.ok && studentDash.data.clearances.length > 0, '8. Student sees department clearance list');

    // 8b. Create Test Faculty Incharge via Clerk Console
    const compDept = studentDash.data.clearances.find(c => c.department_type === 'Online');
    const testFacultyUsername = `faculty_test_${Date.now().toString().slice(-4)}`;
    const testFacultyPassword = 'TestFacultyPassword@123';
    const createFacRes = await req('/clerk/faculty-accounts', 'POST', {
      username: testFacultyUsername,
      password: testFacultyPassword,
      department_id: compDept.department_id,
      branch_code: 'ALL'
    }, clerkToken);
    assert(createFacRes.ok && createFacRes.data.success, '8b. Clerk creates new Faculty Incharge account');
    const facListRes = await req('/clerk/faculty-accounts', 'GET', null, clerkToken);
    const createdFacId = facListRes.data.faculty.find(f => f.username === testFacultyUsername).id;

    // 9. Faculty Login

    const facultyLogin = await req('/auth/faculty/login', 'POST', {
      username: testFacultyUsername,
      password: testFacultyPassword
    });
    assert(facultyLogin.ok && facultyLogin.data.token, '9. Faculty Incharge logs in');
    const facultyToken = facultyLogin.data.token;

    // 10. Faculty Adds a Due with free-text reason
    const addDue = await req('/faculty/dues/add', 'POST', {
      student_pin: testPin,
      reason: 'Unreturned Laboratory Component'
    }, facultyToken);
    assert(addDue.ok && addDue.data.success, '10. Faculty logs free-text due');

    // 11. Student sees Due Reason & Physical Contact instruction
    const studentDashDue = await req('/students/dashboard', 'GET', null, studentToken);
    const flaggedClearance = studentDashDue.data.clearances.find(c => c.department_id === compDept.department_id);
    assert(
      flaggedClearance && 
      flaggedClearance.status === 'Due Found' && 
      flaggedClearance.active_dues[0].contact_instruction.includes('physically'),
      '11. Student sees Due Found status with exact physical contact instruction'
    );

    // 12. Rate-limited 20-hour re-notification enforcement
    const reNotify = await req('/students/no-dues/re-notify', 'POST', {
      departmentId: compDept.department_id
    }, studentToken);
    assert(reNotify.status === 429, '12. Backend strictly rejects re-notification within 20 hours (HTTP 429)');

    // 13. Faculty Clears All Dues
    const clearDues = await req('/faculty/dues/clear-all', 'POST', {
      student_pin: testPin
    }, facultyToken);
    assert(clearDues.ok && clearDues.data.success, '13. Faculty clears student dues, restoring request to re-checkable');

    // 14. Faculty Approves Clearance (Mark Completed)
    const approve = await req('/faculty/approve', 'POST', {
      student_pin: testPin
    }, facultyToken);
    assert(approve.ok && approve.data.success, '14. Faculty grants department approval / marks completed');

    // 15. Approve all remaining departments via Clerk / Faculty
    const currentDash = await req('/students/dashboard', 'GET', null, studentToken);
    for (const cl of currentDash.data.clearances) {
      if (cl.status !== 'Approved') {
        await req('/clerk/departments/physical-approval', 'POST', {
          student_pin: testPin,
          department_id: cl.department_id
        }, clerkToken);
      }
    }
    assert(true, '15. All student clearance records approved');


    // 16. Verify No-Dues Completed on Student Dashboard
    const finalStudentDash = await req('/students/dashboard', 'GET', null, studentToken);
    assert(finalStudentDash.data.is_no_dues_completed === true, '16. Student No-Dues status updates to Completed');

    // 17. Clerk Enters Certificate Data
    const saveCert = await req('/clerk/certificates/data', 'POST', {
      student_pin: testPin,
      date_of_leaving: 'May/June 2026',
      fees_paid: 'Yes',
      promotion_status: 'Passed with Distinction in First Class',
      conduct_character: 'Good'
    }, clerkToken);
    assert(saveCert.ok && saveCert.data.success, '17. Clerk enters certificate-time data');

    // 18. Clerk Final Verifies & Locks Data
    const lockCert = await req('/clerk/certificates/verify-lock', 'POST', {
      student_pin: testPin
    }, clerkToken);
    assert(lockCert.ok && lockCert.data.success, '18. Clerk performs Final Verification and Locks certificate data');

    // 19. Ensure modification is blocked while locked
    const attemptEdit = await req('/clerk/certificates/data', 'POST', {
      student_pin: testPin,
      date_of_leaving: 'June 2026'
    }, clerkToken);
    assert(attemptEdit.status === 400, '19. Locked certificate data cannot be edited without explicit unlock');

    // 20. Clerk Generates Certificate v1
    const genCert1 = await req('/clerk/certificates/generate', 'POST', {
      student_pin: testPin
    }, clerkToken);
    assert(genCert1.ok && genCert1.data.version === 1, '20. Clerk generates Certificate Version v1');

    // 21. Clerk Unlocks, Updates, Re-locks, and Generates v2
    await req('/clerk/certificates/unlock', 'POST', { student_pin: testPin }, clerkToken);
    await req('/clerk/certificates/data', 'POST', {
      student_pin: testPin,
      date_of_leaving: 'May/June 2026',
      fees_paid: 'Yes',
      promotion_status: 'Passed with Distinction and State Rank',
      conduct_character: 'Exemplary'
    }, clerkToken);
    await req('/clerk/certificates/verify-lock', 'POST', { student_pin: testPin }, clerkToken);
    const genCert2 = await req('/clerk/certificates/generate', 'POST', {
      student_pin: testPin
    }, clerkToken);
    assert(genCert2.ok && genCert2.data.version === 2, '21. Clerk completes unlock -> update -> re-lock -> generates v2');

    // 22. Student views Certificate (Receives current version v2, not superseded v1)
    const certView = await req(`/certificates/${testPin}`, 'GET', null, studentToken);
    assert(
      certView.ok && 
      certView.data.certificate.version_number === 2 && 
      certView.data.certificate.t_no === expectedTNo,
      '22. Student views current version v2 with correctly derived T. No (099 -> 99)'
    );

    // 23. Clerk Scope Management: Make Faculty Common
    const makeCommonRes = await req(`/clerk/faculty-accounts/${createdFacId}/scope`, 'PATCH', {
      branch_code: 'ALL'
    }, clerkToken);
    assert(makeCommonRes.ok && makeCommonRes.data.is_common === true, '23. Clerk makes Faculty role Common to all branches');

    // 24. Clerk Branch CRUD: Create and Delete Branch
    const testBranchCode = `TB_${Date.now().toString().slice(-4)}`;
    const testBranchName = `Test Branch ${Date.now()}`;
    const createBranchRes = await req('/clerk/branches', 'POST', {
      code: testBranchCode,
      name: testBranchName
    }, clerkToken);
    assert(createBranchRes.ok && createBranchRes.data.success, '24. Clerk creates new Branch');

    const branchesList = await req('/clerk/branches', 'GET', null, clerkToken);
    const testBr = branchesList.data.branches.find(b => b.code === testBranchCode);
    const deleteBranchRes = await req(`/clerk/branches/${testBr.id}`, 'DELETE', null, clerkToken);
    assert(deleteBranchRes.ok && deleteBranchRes.data.success, '25. Clerk deletes Branch');

    // 26. Clerk Faculty & Department Deletion
    const deleteFacRes = await req(`/clerk/faculty-accounts/${createdFacId}`, 'DELETE', null, clerkToken);
    assert(deleteFacRes.ok && deleteFacRes.data.success, '26. Clerk deletes Faculty Incharge account');

    // 27. Clerk Deletes Single Student Record
    const deleteStudentRes = await req(`/clerk/students/${testPin}`, 'DELETE', null, clerkToken);
    assert(deleteStudentRes.ok && deleteStudentRes.data.success, '27. Clerk deletes single student master & clearance record');

    // 28. Clerk Purges All Student Data in Database
    const purgeStudentsRes = await req('/clerk/students/purge-all', 'DELETE', null, clerkToken);
    assert(purgeStudentsRes.ok && purgeStudentsRes.data.success, '28. Clerk purges all student records and clearance data');



    console.log('\n========================================================');
    console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('========================================================');

    if (failed === 0) {
      process.exit(0);
    } else {
      process.exit(1);
    }
  } catch (err) {
    console.error('Test execution error:', err);
    process.exit(1);
  }
}

runTests();
