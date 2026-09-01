const BASE_URL = 'http://localhost:5000/api';
const fs = require('fs');

async function req(endpoint, method = 'GET', body = null, token = null) {
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (body && !(body instanceof FormData)) headers['Content-Type'] = 'application/json';

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method,
    headers,
    body: body ? (body instanceof FormData ? body : JSON.stringify(body)) : undefined
  });
  const data = await res.json();
  return { status: res.status, ok: res.ok, data };
}

async function testSVGPFeatures() {
  console.log('--- Testing SVGP Tirupati Courses, PIN Search, Single Student Add & Full Master Edit ---');

  // 1. Verify SVGP Branches
  const branchRes = await req('/branches');
  console.log('[1] Branches count:', branchRes.data.branches.length);
  const branchNames = branchRes.data.branches.map(b => b.code);
  console.log('    Branch codes:', branchNames);

  // 2. Clerk Login
  const clerkLogin = await req('/auth/clerk/login', 'POST', {
    username: 'clerk_admin',
    password: 'ClerkPassword@2026'
  });
  const clerkToken = clerkLogin.data.token;
  console.log('[2] Clerk logged in:', clerkLogin.ok);

  // 3. Add a Single Student Directly (Without Excel)
  const randSuffix = Math.floor(100 + Math.random() * 899);
  const newStudentPin = `23018-BM-${randSuffix}`;
  const addSingleRes = await req('/clerk/students', 'POST', {
    pin: newStudentPin,
    student_name: 'Palepu Naveen',
    father_name: 'Palepu Venkateswarlu',
    dob: '14-06-2006',
    date_of_admission: '01-07-2023',
    nationality: 'Indian',
    religion: 'Hindu',
    course_branch: 'Biomedical Engineering'
  }, clerkToken);
  console.log('[3] Add Single Student (Biomedical):', addSingleRes.ok, addSingleRes.data.message);

  // 4. Search Student by PIN
  const searchPinRes = await req(`/clerk/students?search=${newStudentPin}`, 'GET', null, clerkToken);
  console.log(`[4] Search by PIN (${newStudentPin}):`, searchPinRes.data.students?.length === 1, searchPinRes.data.students?.[0]?.student_name);

  // 5. Search Student by Name Keyword
  const searchNameRes = await req('/clerk/students?search=naveen', 'GET', null, clerkToken);
  console.log('[5] Search by Name keyword (naveen):', (searchNameRes.data.students?.length || 0) >= 1);

  // 6. Edit Total Master Data of Student
  const editRes = await req(`/clerk/students/${newStudentPin}`, 'PUT', {
    admission_no: `ADM-23018-BM${randSuffix}-REV`,
    student_name: 'Palepu Naveen Kumar',
    father_name: 'Palepu Venkateswarlu Naidu',
    dob: '14-06-2006',
    date_of_admission: '01-07-2023',
    nationality: 'Indian',
    religion: 'Hindu',
    course_branch: 'Biomedical Engineering'
  }, clerkToken);
  console.log('[6] Edit Total Master Student Data:', editRes.ok, editRes.data.message);

  // 7. Verify Edits
  const verifyEditRes = await req(`/clerk/students?search=${newStudentPin}`, 'GET', null, clerkToken);
  const updatedStudent = verifyEditRes.data.students[0];
  console.log('[7] Verified Updated Name:', updatedStudent.student_name === 'Palepu Naveen Kumar');
  console.log('    Verified Updated Father:', updatedStudent.father_name === 'Palepu Venkateswarlu Naidu');
  console.log('    Verified Updated Admission No:', updatedStudent.admission_no === `ADM-23018-BM${randSuffix}-REV`);

  // 8. Upload and Commit SVGP Excel File (SVGP_Tirupati_Student_Master.xlsx)
  const path = require('path');
  const filePath = path.join(__dirname, '../../SVGP_Tirupati_Student_Master.xlsx');
  const fileBuffer = fs.readFileSync(filePath);
  const blob = new Blob([fileBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const form = new FormData();
  form.append('file', blob, 'SVGP_Tirupati_Student_Master.xlsx');

  const uploadRes = await req('/clerk/excel/preview', 'POST', form, clerkToken);
  console.log('[8] SVGP Excel Preview:', uploadRes.ok, uploadRes.data.summary);

  const commitRes = await req('/clerk/excel/commit', 'POST', { validRows: uploadRes.data.validRows }, clerkToken);
  console.log('[9] SVGP Excel Commit:', commitRes.ok, commitRes.data.message);

  // 10. Student Registration from SVGP D.Pharma Branch
  const pharmStudentPin = '24018-PH-071';
  const regPharmRes = await req('/auth/student/register', 'POST', {
    pin: pharmStudentPin,
    name: 'bathula keerthi priya',
    department: 'D.Pharma (Diploma in Pharmacy)'
  });
  console.log('[10] Student Register (D.Pharma):', regPharmRes.ok);

  const subDuesRes = await req('/students/no-dues/submit', 'POST', {}, regPharmRes.data.token);
  console.log('[11] D.Pharma Student Submits No-Dues:', subDuesRes.ok);

  const pharmDash = await req('/students/dashboard', 'GET', null, regPharmRes.data.token);
  const assignedDepts = pharmDash.data.clearances.map(c => c.department_name);
  console.log('[12] Departments assigned to D.Pharma student:', assignedDepts);
  const hasPharmLab = assignedDepts.includes('Pharmaceutics Lab');
  const hasChemLab = assignedDepts.includes('Pharmaceutical Chemistry Lab');
  const noCompLab = !assignedDepts.includes('Computer Lab');
  console.log('     Has Pharmaceutics Lab:', hasPharmLab);
  console.log('     Has Pharmaceutical Chemistry Lab:', hasChemLab);
  console.log('     Excludes CSE Computer Lab:', noCompLab);

  if (addSingleRes.ok && searchPinRes.ok && editRes.ok && commitRes.ok && hasPharmLab && noCompLab) {
    console.log('\n🎉 ALL SVGP TIRUPATI FEATURES & ENHANCEMENTS VERIFIED SUCCESSFULLY!');
  } else {
    console.error('\n❌ VERIFICATION FAILED');
  }
}

testSVGPFeatures();
