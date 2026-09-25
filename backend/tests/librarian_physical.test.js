const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const BASE_URL = 'http://localhost:5000/api';

async function req(endpoint, method = 'GET', body = null, token = null) {
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (body) headers['Content-Type'] = 'application/json';

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });
  const data = await res.json();
  return { status: res.status, ok: res.ok, data };
}

async function testLibrarianPhysicalClearance() {
  console.log('================================================================');
  console.log('TESTING PHYSICAL LIBRARY CLEARANCE VIA FACULTY/LIBRARIAN INCHARGE');
  console.log('================================================================\n');

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
    // 1. Clerk Authentication
    const clerkUser = process.env.CLERK_USERNAME || 'clerk@svgp';
    const clerkPass = process.env.CLERK_PASSWORD || 'admin123';
    const clerkLogin = await req('/auth/clerk/login', 'POST', {
      username: clerkUser,
      password: clerkPass
    });
    assert(clerkLogin.ok && clerkLogin.data.token, '1. Clerk authenticates successfully');
    const clerkToken = clerkLogin.data.token;

    // 2. Department Verification (Library remains type: Physical)
    const deptsRes = await req('/departments');
    const libDept = deptsRes.data.departments.find(d => d.name === 'Library');
    assert(libDept && libDept.type === 'Physical', '2. Library department retains type: Physical');
    assert(libDept && libDept.branch_code === 'ALL', '2b. Library department is Common to ALL branches');

    // 3. Librarian Authentication via existing Faculty authentication system
    const libLogin = await req('/auth/faculty/login', 'POST', {
      username: 'librarian',
      password: process.env.LIBRARIAN_PASSWORD || 'librarian123'
    });
    assert(libLogin.ok && libLogin.data.token, '3. Librarian authenticates via existing Faculty login endpoint');
    const libToken = libLogin.data.token;
    assert(libLogin.data.faculty.department_name === 'Library', '3b. Librarian faculty account is linked to Library department');

    // 4. Create and Commit Test Student to Master
    const testPin = `24018-CM-${Math.floor(100 + Math.random() * 899)}`;
    const commitRes = await req('/clerk/excel/commit', 'POST', {
      validRows: [
        {
          pin: testPin,
          admission_no: 'ADM-2024-LIBPHY',
          student_name: 'Dileep Kumar',
          father_name: 'Venkata Ramana',
          dob: '10-06-2005',
          nationality: 'Indian',
          religion: 'Hindu',
          course_branch: 'Computer Engineering',
          date_of_admission: '01-07-2024'
        }
      ]
    }, clerkToken);
    assert(commitRes.ok && commitRes.data.success, '4. Student committed to master database');

    // 5. Student Registers and Logs In
    const studentReg = await req('/auth/student/register', 'POST', {
      pin: testPin,
      name: 'Dileep Kumar',
      department: 'Computer Engineering'
    });
    assert(studentReg.ok && studentReg.data.token, '5. Student registers and authenticates');
    const studentToken = studentReg.data.token;

    // 6. Student Submits No-Dues Clearance Request (Non-Cadet)
    const submitReq = await req('/students/no-dues/submit', 'POST', { is_ncc_cadet: false }, studentToken);
    assert(submitReq.ok && submitReq.data.requestId, '6. Student submits No-Dues clearance request');

    // 7. Student Dashboard Verification - Library is Pending
    const studentDash1 = await req('/students/dashboard', 'GET', null, studentToken);
    const libClearance1 = studentDash1.data.clearances.find(c => c.department_name === 'Library');
    assert(libClearance1 && libClearance1.status === 'Pending', '7. Library clearance status is Pending');
    assert(libClearance1 && libClearance1.department_type === 'Physical', '7b. Library clearance maintains department_type: Physical');

    // 8. Librarian Dashboard lists the student's clearance request
    const libDash = await req('/faculty/dashboard', 'GET', null, libToken);
    const studentInLibList = libDash.data.requests.find(r => r.student_pin === testPin);
    assert(studentInLibList !== undefined, '8. Librarian dashboard lists student in clearance queue');

    // 9. Librarian Records Book Due with Fine
    const addDueRes = await req('/faculty/dues/add', 'POST', {
      student_pin: testPin,
      reason: '2 books not returned: Operating Systems Concepts (Acc #3091), Database Systems (Acc #4102)',
      amount: '50'
    }, libToken);
    assert(addDueRes.ok && addDueRes.data.success, '9. Librarian logs library book due and fine');

    // 10. Student Dashboard reflects Due Found with physical library contact directive
    const studentDash2 = await req('/students/dashboard', 'GET', null, studentToken);
    const libClearance2 = studentDash2.data.clearances.find(c => c.department_name === 'Library');
    assert(libClearance2 && libClearance2.status === 'Due Found', '10. Student dashboard reflects Library status: Due Found');
    assert(libClearance2.active_dues[0].reason.includes('2 books not returned'), '10b. Student sees exact book due detail');
    assert(libClearance2.active_dues[0].contact_instruction.includes('Librarian physically'), '10c. Student sees physical Librarian visit directive');

    // 11. Security Check: Librarian cannot approve while active dues exist
    const blockedApprove = await req('/faculty/approve', 'POST', {
      student_pin: testPin
    }, libToken);
    assert(blockedApprove.status === 400, '11. Backend prevents Librarian from approving while active dues remain');

    // 12. Security Check: Clerk cannot bypass Librarian for Library clearance
    const clerkAttempt = await req('/clerk/departments/physical-approval', 'POST', {
      student_pin: testPin,
      department_id: libDept.id
    }, clerkToken);
    assert(clerkAttempt.status === 403, '12. Backend prevents Clerk from approving Library physical clearance');

    // 13. Security Check: Another Department Faculty cannot approve Library clearance
    const accountsDept = deptsRes.data.departments.find(d => d.name === 'Accounts');
    const testAccountsUser = `accounts_test_${Date.now().toString().slice(-4)}`;
    await req('/clerk/faculty-accounts', 'POST', {
      username: testAccountsUser,
      password: 'AccountsPassword@123',
      department_id: accountsDept.id,
      branch_code: 'ALL'
    }, clerkToken);
    const accountsLogin = await req('/auth/faculty/login', 'POST', {
      username: testAccountsUser,
      password: 'AccountsPassword@123'
    });
    const accountsToken = accountsLogin.data.token;

    const crossDeptApprove = await req('/faculty/approve', 'POST', {
      student_pin: testPin,
      department_id: libDept.id
    }, accountsToken);
    assert(crossDeptApprove.status === 403, '13. Accounts Faculty is rejected from approving Library clearance');

    // 14. Student visits Library physically & clears dues -> Librarian clears dues
    const clearDueRes = await req('/faculty/dues/clear-all', 'POST', {
      student_pin: testPin
    }, libToken);
    assert(clearDueRes.ok && clearDueRes.data.success, '14. Librarian clears dues in system upon physical book return');

    // 15. Librarian Approves Library Clearance
    const approveRes = await req('/faculty/approve', 'POST', {
      student_pin: testPin
    }, libToken);
    assert(approveRes.ok && approveRes.data.success, '15. Librarian approves Library physical clearance');

    // 16. Student Dashboard confirms Approved state with Librarian username and timestamp
    const studentDash3 = await req('/students/dashboard', 'GET', null, studentToken);
    const libClearance3 = studentDash3.data.clearances.find(c => c.department_name === 'Library');
    assert(libClearance3 && libClearance3.status === 'Approved', '16. Student dashboard shows Library Approved');
    assert(libClearance3.approved_by === 'librarian', '16b. Clearance records approved_by: librarian');
    assert(libClearance3.approved_at !== null, '16c. Clearance records approved_at timestamp');

    // 17. NSS/NCC non-cadet physical clearance remains handled by Clerk
    const nccClearance = studentDash3.data.clearances.find(c => c.department_name.includes('NSS') || c.department_name.includes('NCC'));
    if (nccClearance) {
      const clerkNccApprove = await req('/clerk/departments/physical-approval', 'POST', {
        student_pin: testPin,
        department_id: nccClearance.department_id
      }, clerkToken);
      assert(clerkNccApprove.ok && clerkNccApprove.data.success, '17. Clerk handles NSS/NCC non-cadet physical clearance successfully');
    }

    // Clean up temporary test student
    await req(`/clerk/students/${testPin}`, 'DELETE', null, clerkToken);

    console.log(`\n================================================================`);
    console.log(`ALL TESTS PASSED: ${passed} PASSED, ${failed} FAILED`);
    console.log(`================================================================\n`);

    if (failed > 0) process.exit(1);
    process.exit(0);
  } catch (err) {
    console.error('Test execution error:', err);
    process.exit(1);
  }
}

testLibrarianPhysicalClearance();
