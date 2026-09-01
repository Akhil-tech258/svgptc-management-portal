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

async function testBranchesFeature() {
  console.log('--- Testing Multi-Branch & Branch-Specific Clearance System ---');

  // 1. Clerk Login
  const clerkLogin = await req('/auth/clerk/login', 'POST', {
    username: 'clerk_admin',
    password: 'ClerkPassword@2026'
  });
  const clerkToken = clerkLogin.data.token;
  console.log('[1] Clerk logged in:', clerkLogin.ok);

  // 2. Clerk creates a new branch: AIML
  const newBranch = await req('/clerk/branches', 'POST', {
    code: 'AIML',
    name: 'Artificial Intelligence & Machine Learning'
  }, clerkToken);
  console.log('[2] Clerk created AIML branch:', newBranch.ok, newBranch.data.message);

  // 3. Clerk creates an AIML specific lab
  const newDept = await req('/clerk/departments', 'POST', {
    name: 'Deep Learning & GPU Lab',
    type: 'Online',
    branch_code: 'AIML'
  }, clerkToken);
  console.log('[3] Clerk created AIML department:', newDept.ok, newDept.data.message);

  // 4. Import a Mechanical student
  const mechPin = '24018-ME-011';
  await req('/clerk/excel/commit', 'POST', {
    validRows: [
      {
        pin: mechPin,
        admission_no: 'ADM-2024-ME011',
        student_name: 'Karthik Reddy',
        father_name: 'Srinivas Reddy',
        dob: '20-05-2005',
        nationality: 'Indian',
        religion: 'Hindu',
        course_branch: 'Mechanical Engineering',
        date_of_admission: '01-07-2024'
      }
    ]
  }, clerkToken);
  console.log('[4] Mechanical student imported into master records');

  // 5. Mechanical student registers
  const regRes = await req('/auth/student/register', 'POST', {
    pin: mechPin,
    name: 'karthik reddy',
    department: 'Mechanical Engineering'
  });
  console.log('[5] Mechanical student registered:', regRes.ok);
  const mechToken = regRes.data.token;

  // 6. Mechanical student submits No-Dues
  const subRes = await req('/students/no-dues/submit', 'POST', {}, mechToken);
  console.log('[6] Mechanical student submitted No-Dues:', subRes.ok);

  // 7. Check Mechanical student's clearance list
  const dashRes = await req('/students/dashboard', 'GET', null, mechToken);
  const deptsAssigned = dashRes.data.clearances.map(c => c.department_name);
  console.log('[7] Departments assigned to Mechanical student:', deptsAssigned);

  const hasWorkshop = deptsAssigned.includes('Mechanical Workshop');
  const hasCadCam = deptsAssigned.includes('CAD/CAM Lab');
  const hasComputerLab = deptsAssigned.includes('Computer Lab');
  const hasGpuLab = deptsAssigned.includes('Deep Learning & GPU Lab');
  const hasLibrary = deptsAssigned.includes('Library');

  console.log(' - Includes Mechanical Workshop:', hasWorkshop);
  console.log(' - Includes CAD/CAM Lab:', hasCadCam);
  console.log(' - Excludes CSE Computer Lab:', !hasComputerLab);
  console.log(' - Excludes AIML GPU Lab:', !hasGpuLab);
  console.log(' - Includes Common Library:', hasLibrary);

  if (hasWorkshop && hasCadCam && !hasComputerLab && !hasGpuLab && hasLibrary) {
    console.log('\n✅ ALL MULTI-BRANCH CLEARANCE CRITERIA VERIFIED SUCCESSFULLY!');
    return;
  } else {
    console.error('\n❌ FAILED BRANCH-SPECIFIC CLEARANCE CHECKS');
    process.exit(1);
  }
}

testBranchesFeature();
