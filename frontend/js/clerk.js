// Clerk Administration JavaScript

let stagedValidRows = [];
let editingStudentPin = null;
let resettingFacultyId = null;
let cachedMasterStudents = [];
let cachedBranches = [];
let cachedDepartments = [];

document.addEventListener('DOMContentLoaded', () => {
  initCollegeBranding();
  checkAuthAndInit();
  setupLoginListener();
  setupExcelDropZone();
});

function initCollegeBranding() {
  if (window.APP_CONFIG && window.APP_CONFIG.COLLEGE) {
    const titleEl = document.getElementById('college-name-display');
    const crestEl = document.getElementById('college-crest-img');
    if (titleEl) titleEl.innerText = window.APP_CONFIG.COLLEGE.NAME;
    if (crestEl) crestEl.src = window.APP_CONFIG.COLLEGE.LOGO_PATH;

    const sampleBtn = document.getElementById('btn-download-sample');
    if (sampleBtn) {
      sampleBtn.href = `${window.APP_CONFIG.API_BASE_URL}/clerk/excel/sample`;
    }
  }
}

function checkAuthAndInit() {
  const user = API.getUser();
  const token = API.getToken();

  if (token && user && user.role === 'clerk') {
    showDashboard(user);
  } else {
    showAuth();
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/[&<>"']/g, m => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[m]));
}

function showAuth() {
  document.getElementById('auth-section').style.display = 'block';
  document.getElementById('dashboard-section').style.display = 'none';
  const badge = document.getElementById('clerk-logged-in-badge');
  if (badge) badge.style.display = 'none';
}

function showDashboard(user) {
  try {
    document.getElementById('auth-section').style.display = 'none';
    document.getElementById('dashboard-section').style.display = 'block';

    const badge = document.getElementById('clerk-logged-in-badge');
    if (badge) badge.style.display = 'flex';
    const userEl = document.getElementById('clerk-badge-user');
    if (userEl) userEl.innerText = (user && user.username) || 'Clerk';

    switchClerkTab('overview');
    ensureBranchesLoaded();
  } catch (err) {
    console.error('showDashboard error:', err);
  }
}


function setupLoginListener() {
  const form = document.getElementById('clerk-login-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('clerk-username').value.trim();
    const password = document.getElementById('clerk-password').value;

    if (!username || !password) {
      API.showToast('Please enter both username and password.', 'error');
      return;
    }

    const btn = document.getElementById('btn-clerk-login');
    if (btn) {
      btn.disabled = true;
      btn.innerText = 'Verifying...';
    }

    const res = await API.request('/auth/clerk/login', {
      method: 'POST',
      body: { username, password }
    });

    if (btn) {
      btn.disabled = false;
      btn.innerText = '🔐 Sign In to Administrative Console';
    }

    if (res.ok && res.data.success) {
      API.setAuth(res.data.token, { ...res.data.clerk, role: 'clerk' });
      API.showToast('Clerk authentication successful.', 'success');
      showDashboard(res.data.clerk);
    } else {
      API.showToast(res.data.error || 'Clerk login failed.', 'error');
    }
  });
}

// Tab Switching

async function switchClerkTab(tab) {
  const tabs = ['overview', 'excel', 'certificates', 'physical', 'faculty', 'departments'];
  tabs.forEach(t => {
    const pane = document.getElementById(`pane-${t}`);
    const btn = document.getElementById(`tab-${t}`);
    if (pane && btn) {
      if (t === tab) {
        pane.style.display = 'block';
        btn.classList.add('active');
      } else {
        pane.style.display = 'none';
        btn.classList.remove('active');
      }
    }
  });

  if (tab === 'overview') {
    loadClerkDashboard();
    loadOverviewData();
  }
  if (tab === 'excel') loadMasterStudents();
  if (tab === 'certificates') loadCertificateStudents();
  if (tab === 'physical') loadPhysicalDeptsDropdown();
  if (tab === 'faculty') loadFacultyAccounts();
  if (tab === 'departments') {
    await loadBranches();
    await loadDepartments();
  }
}

async function loadClerkDashboard() {
  const res = await API.request('/clerk/dashboard');
  if (!res.ok) {
    API.showToast(res.data.error || 'Failed to load Clerk statistics.', 'error');
    return;
  }

  const s = res.data.stats || {};
  const masterCount = s.total_students_master != null ? s.total_students_master : 0;
  const regCount = s.registered_students != null ? s.registered_students : 0;
  const pendingCount = s.pending_no_dues != null ? s.pending_no_dues : 0;
  const compCount = s.completed_no_dues != null ? s.completed_no_dues : 0;
  const duesCount = s.active_dues_college != null ? s.active_dues_college : 0;
  const certsCount = s.certificates_generated != null ? s.certificates_generated : 0;
  const deptsCount = s.total_departments != null ? s.total_departments : 0;
  const facultyCount = s.total_faculty != null ? s.total_faculty : 0;

  const masterEl = document.getElementById('stat-total-master');
  if (masterEl) masterEl.innerText = masterCount;

  const regEl = document.getElementById('stat-reg-students');
  if (regEl) regEl.innerText = regCount;

  const pendingEl = document.getElementById('stat-pending-nodues');
  if (pendingEl) pendingEl.innerText = pendingCount;

  const compEl = document.getElementById('stat-completed-nodues');
  if (compEl) compEl.innerText = compCount;

  const duesEl = document.getElementById('stat-active-dues');
  if (duesEl) duesEl.innerText = duesCount;

  const certsEl = document.getElementById('stat-certs-issued');
  if (certsEl) certsEl.innerText = certsCount;

  const deptEl = document.getElementById('stat-total-departments');
  if (deptEl) deptEl.innerText = deptsCount;

  const facEl = document.getElementById('stat-total-faculty');
  if (facEl) facEl.innerText = facultyCount;

  // Dynamically update top tab badges
  const masterBadge = document.getElementById('tab-badge-master');
  if (masterBadge) masterBadge.innerText = masterCount;

  const facBadge = document.getElementById('tab-badge-faculty');
  if (facBadge) facBadge.innerText = facultyCount;

  const branchesBadge = document.getElementById('tab-badge-branches');
  if (branchesBadge) branchesBadge.innerText = 9;

  // Refresh live overview role roster
  loadOverviewData();
}

async function loadOverviewData() {
  const tbody = document.getElementById('overview-clearance-roles-body');
  if (!tbody) return;

  const [deptsRes, facRes] = await Promise.all([
    API.request('/clerk/departments'),
    API.request('/clerk/faculty-accounts')
  ]);

  const depts = (deptsRes.ok && deptsRes.data.departments) || [];
  const faculty = (facRes.ok && facRes.data.faculty) || [];

  tbody.innerHTML = '';
  if (depts.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:var(--text-muted); padding:1.5rem;">No clearance sections found.</td></tr>';
    return;
  }

  depts.forEach((d, index) => {
    const assignedFac = faculty.find(f => f.department_id === d.id);
    const tr = document.createElement('tr');
    const isPhysical = d.type === 'Physical';
    const bCode = d.branch_code || 'ALL';
    const scopeBadge = bCode === 'ALL'
      ? '<span class="badge badge-info">All Branches (Common)</span>'
      : `<span class="badge badge-approved" style="font-family:var(--font-mono);">${escapeHtml(bCode)}</span>`;

    let inchargeCol = '';
    if (isPhysical) {
      inchargeCol = '<span style="color:var(--text-muted); font-style:italic;">🏛️ Clerk Physical Sign-off</span>';
    } else if (assignedFac) {
      inchargeCol = `<span style="font-family:var(--font-mono); color:var(--accent-gold); font-weight:600;">${escapeHtml(assignedFac.username)}</span>`;
    } else {
      inchargeCol = '<span style="color:var(--status-due); font-size:0.8rem; font-style:italic;">⚠️ No Incharge Assigned</span>';
    }

    let statusCol = '';
    if (isPhysical) {
      statusCol = '<span class="badge badge-approved">Active</span>';
    } else if (assignedFac) {
      statusCol = assignedFac.is_active ? '<span class="badge badge-approved">Active</span>' : '<span class="badge badge-due">Inactive</span>';
    } else {
      statusCol = '<span class="badge badge-pending">Unassigned</span>';
    }

    tr.innerHTML = `
      <td style="font-weight:600; color:var(--text-muted);">${index + 1}</td>
      <td><strong>${escapeHtml(d.name)}</strong></td>
      <td>${scopeBadge}</td>
      <td><span class="badge ${d.type === 'Online' ? 'badge-info' : 'badge-pending'}">${escapeHtml(d.type)}</span></td>
      <td>${inchargeCol}</td>
      <td>${statusCol}</td>
    `;
    tbody.appendChild(tr);
  });
}



// --- EXCEL IMPORT ---
function setupExcelDropZone() {
  const dropZone = document.getElementById('excel-drop-zone');
  if (!dropZone) return;

  const headline = document.getElementById('drop-headline-text');
  const subtext = document.getElementById('drop-subtext-text');
  const icon = document.getElementById('drop-icon-symbol');

  ['dragenter', 'dragover'].forEach(name => {
    dropZone.addEventListener(name, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.add('drag-active');
      if (headline) headline.innerText = 'Release to Drop Excel Workbook Now!';
      if (subtext) subtext.innerText = 'Instant row parsing and schema validation will start immediately.';
      if (icon) icon.innerText = '📥';
    }, false);
  });

  ['dragleave', 'drop'].forEach(name => {
    dropZone.addEventListener(name, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.remove('drag-active');
      if (headline) headline.innerText = 'Drag & Drop Student Excel Workbook Here';
      if (subtext) subtext.innerText = 'Drop any student spreadsheet (.xlsx, .xls) directly into this area. Dynamic header detection automatically identifies column mappings and validates every row.';
      if (icon) icon.innerText = '📊';
    }, false);
  });

  dropZone.addEventListener('drop', (e) => {
    const dt = e.dataTransfer;
    const files = dt && dt.files;
    if (files && files.length > 0) {
      processExcelFile(files[0]);
    }
  }, false);
}

function handleExcelFileSelected(e) {
  const file = e.target.files && e.target.files[0];
  if (!file) return;
  processExcelFile(file);
  e.target.value = '';
}

function resetSelectedFile() {
  const statusCard = document.getElementById('file-selected-status-card');
  const previewBox = document.getElementById('excel-preview-box');
  const fileInput = document.getElementById('excel-file-input');
  if (statusCard) statusCard.style.display = 'none';
  if (previewBox) previewBox.style.display = 'none';
  if (fileInput) fileInput.value = '';
  stagedValidRows = [];
}

async function processExcelFile(file) {
  if (!file) return;

  const fileName = (file.name || '').toLowerCase();
  if (!fileName.endsWith('.xlsx') && !fileName.endsWith('.xls')) {
    API.showToast('Please upload a valid Microsoft Excel file (.xlsx or .xls).', 'error');
    return;
  }

  // Show status card
  const statusCard = document.getElementById('file-selected-status-card');
  const nameEl = document.getElementById('selected-file-name');
  const metaEl = document.getElementById('selected-file-meta');
  const statusBadge = document.getElementById('file-status-indicator');

  if (statusCard) statusCard.style.display = 'flex';
  if (nameEl) nameEl.innerText = file.name;
  const sizeKb = (file.size / 1024).toFixed(1);
  if (metaEl) metaEl.innerText = `${sizeKb} KB • Analyzing and validating rows...`;
  if (statusBadge) {
    statusBadge.className = 'badge badge-pending';
    statusBadge.innerText = 'Analyzing...';
  }

  const formData = new FormData();
  formData.append('file', file);

  API.showToast(`Analyzing and validating "${file.name}"...`, 'info');

  const res = await API.request('/clerk/excel/preview', {
    method: 'POST',
    body: formData
  });

  if (!res.ok) {
    if (statusBadge) {
      statusBadge.className = 'badge badge-due';
      statusBadge.innerText = 'Validation Failed';
    }
    if (metaEl) metaEl.innerText = `${sizeKb} KB • ${res.data.error || 'Failed to process file'}`;
    API.showToast(res.data.error || 'Failed to process Excel file.', 'error');
    return;
  }

  const sum = res.data.summary || {};
  if (statusBadge) {
    statusBadge.className = 'badge badge-approved';
    statusBadge.innerText = `Valid: ${sum.valid} | Rejected: ${sum.rejected}`;
  }
  if (metaEl) {
    metaEl.innerText = `${sizeKb} KB • Completed • ${sum.total} total rows parsed`;
  }

  const previewBox = document.getElementById('excel-preview-box');
  previewBox.style.display = 'block';

  document.getElementById('preview-total').innerText = sum.total || 0;
  document.getElementById('preview-valid').innerText = sum.valid || 0;
  document.getElementById('preview-rejected').innerText = sum.rejected || 0;
  document.getElementById('preview-new').innerText = sum.newRows || 0;
  document.getElementById('preview-updates').innerText = sum.updateRows || 0;

  stagedValidRows = res.data.validRows || [];
  const rejectedRows = res.data.rejectedRows || [];

  // Render Rejected Rows
  const rejBox = document.getElementById('rejected-rows-table-box');
  const rejBody = document.getElementById('rejected-rows-body');
  rejBody.innerHTML = '';

  if (rejectedRows.length > 0) {
    rejBox.style.display = 'block';
    rejectedRows.forEach(r => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="color:var(--status-due); font-weight:bold;">#${r.rowNumber}</td>
        <td style="font-family:var(--font-mono);">${r.pin}</td>
        <td>${r.student_name}</td>
        <td style="color:#fca5a5;">${r.reasons.join('; ')}</td>
      `;
      rejBody.appendChild(tr);
    });
  } else {
    rejBox.style.display = 'none';
  }

  // Render Valid Rows
  const validBody = document.getElementById('valid-rows-body');
  validBody.innerHTML = '';

  stagedValidRows.slice(0, 100).forEach(r => {
    const tr = document.createElement('tr');
    const actionBadge = r.isUpdate 
      ? '<span class="badge badge-info">Update</span>' 
      : '<span class="badge badge-approved">New</span>';

    tr.innerHTML = `
      <td>#${r.rowNumber}</td>
      <td>${actionBadge}</td>
      <td style="font-family:var(--font-mono); font-weight:600; color:var(--accent-gold);">${r.pin}</td>
      <td><strong>${r.student_name}</strong></td>
      <td style="color:var(--text-secondary);">${r.admission_no}</td>
      <td style="color:var(--text-secondary);">${r.course_branch}</td>
      <td>${r.dob}</td>
      <td>${r.date_of_admission}</td>
    `;
    validBody.appendChild(tr);
  });

  const commitBtn = document.getElementById('btn-commit-import');
  commitBtn.disabled = stagedValidRows.length === 0;

  API.showToast(`Validation complete. ${stagedValidRows.length} valid rows, ${rejectedRows.length} rejected rows.`, 'info');
}

async function commitImport() {
  if (!stagedValidRows || stagedValidRows.length === 0) return;

  const btn = document.getElementById('btn-commit-import');
  btn.disabled = true;
  btn.innerText = 'Committing to PostgreSQL...';

  const res = await API.request('/clerk/excel/commit', {
    method: 'POST',
    body: { validRows: stagedValidRows }
  });

  btn.disabled = false;
  btn.innerText = '✓ Confirm & Commit Valid Rows to Database';

  if (res.ok && res.data.success) {
    API.showToast(res.data.message, 'success');
    document.getElementById('excel-preview-box').style.display = 'none';
    stagedValidRows = [];
    loadClerkDashboard();
    loadMasterStudents();
  } else {
    API.showToast(res.data.error || 'Failed to commit rows.', 'error');
  }
}

// --- STUDENT MASTER DIRECTORY & SINGLE RECORD MANAGEMENT ---

async function loadMasterStudents(search = '') {
  const tbody = document.getElementById('master-students-table-body');
  if (!tbody) return;

  const url = search ? `/clerk/students?search=${encodeURIComponent(search)}` : '/clerk/students';
  const res = await API.request(url);

  tbody.innerHTML = '';
  if (!res.ok || !res.data.students) {
    tbody.innerHTML = '<tr><td colspan="9" style="text-align:center; color:var(--text-muted); padding:1.5rem;">Failed to load student master records.</td></tr>';
    return;
  }

  cachedMasterStudents = res.data.students;

  if (cachedMasterStudents.length === 0) {
    tbody.innerHTML = '<tr><td colspan="9" style="text-align:center; color:var(--text-muted); padding:2rem;">No students found matching your search.</td></tr>';
    return;
  }

  cachedMasterStudents.forEach(s => {
    const tr = document.createElement('tr');
    
    // Status Badge
    let statusBadge = '<span class="badge badge-due">Not Started</span>';
    if (s.no_dues_status === 'Completed') {
      statusBadge = '<span class="badge badge-approved">Completed</span>';
    } else if (s.no_dues_status === 'In Progress' || s.no_dues_status === 'Pending') {
      statusBadge = '<span class="badge badge-pending">In Progress</span>';
    } else if (s.registered_at) {
      statusBadge = '<span class="badge badge-info">Registered</span>';
    }

    tr.innerHTML = `
      <td style="font-family:var(--font-mono); font-weight:600; color:var(--accent-gold);">${s.pin}</td>
      <td style="font-family:var(--font-mono); font-size:0.85rem;">${s.admission_no || '-'}</td>
      <td><strong>${s.student_name}</strong></td>
      <td style="color:var(--text-secondary);">${s.father_name || '-'}</td>
      <td><span class="badge badge-info">${s.course_branch}</span></td>
      <td>${s.dob || '-'}</td>
      <td>${s.date_of_admission || '-'}</td>
      <td>${statusBadge}</td>
      <td>
        <button class="btn btn-sm btn-secondary" onclick="openEditMasterStudentModal('${escapeHtml(s.pin)}')">
          ✏️ Edit
        </button>
        <button class="btn btn-sm btn-danger" style="margin-left:0.3rem; background:#dc2626;" onclick="deleteSingleStudent('${escapeHtml(s.pin)}')">
          🗑️ Delete
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function searchMasterStudents() {
  const input = document.getElementById('master-search-input');
  const q = input ? input.value.trim() : '';
  loadMasterStudents(q);
}

function resetMasterSearch() {
  const input = document.getElementById('master-search-input');
  if (input) input.value = '';
  loadMasterStudents('');
}

async function deleteSingleStudent(pin) {
  if (!confirm(`⚠️ Are you sure you want to permanently delete student with PIN "${pin}" and all associated clearance records?\nThis action cannot be undone.`)) {
    return;
  }

  const res = await API.request(`/clerk/students/${encodeURIComponent(pin)}`, {
    method: 'DELETE'
  });

  if (res.ok && res.data.success) {
    API.showToast(res.data.message || `Student ${pin} deleted.`, 'success');
    loadMasterStudents('');
    loadCertificateStudents();
    loadClerkDashboard();
  } else {
    API.showToast(res.data.error || 'Failed to delete student.', 'error');
  }
}

async function purgeAllStudentData() {
  if (!confirm('🚨 CRITICAL ACTION:\nAre you sure you want to PERMANENTLY DELETE ALL STUDENT DATA in the college database?\n\nThis will purge:\n• All Enrolled Student Master Records\n• All Registered Accounts\n• All No-Dues Requests & Clearances\n• All Recorded Dues\n• All Certificate Data & Generated Versions\n\nClick OK to confirm permanent purge.')) {
    return;
  }

  const res = await API.request('/clerk/students/purge-all', {
    method: 'DELETE'
  });

  if (res.ok && res.data.success) {
    API.showToast('All student records and clearance data have been completely purged!', 'success');
    loadMasterStudents('');
    loadCertificateStudents();
    loadClerkDashboard();
  } else {
    API.showToast(res.data.error || 'Failed to purge student data.', 'error');
  }
}


// Single Student Enrollment Modal
async function openAddSingleStudentModal() {
  await ensureBranchesLoaded();
  const select = document.getElementById('single-student-branch-select');
  select.innerHTML = '<option value="">-- Select SVGP Course / Branch --</option>';
  cachedBranches.forEach(b => {
    const opt = document.createElement('option');
    opt.value = b.name;
    opt.innerText = `${b.name} (${b.code})`;
    select.appendChild(opt);
  });

  document.getElementById('form-add-single-student').reset();
  document.getElementById('single-nat-input').value = 'Indian';
  document.getElementById('single-rel-input').value = 'Hindu';
  document.getElementById('modal-add-single-student').style.display = 'flex';
}

function closeAddSingleStudentModal() {
  document.getElementById('modal-add-single-student').style.display = 'none';
}

function toInputDate(dStr) {
  if (!dStr) return '';
  dStr = dStr.trim();
  const dmy = dStr.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (dmy) {
    const dd = dmy[1].padStart(2, '0');
    const mm = dmy[2].padStart(2, '0');
    const yyyy = dmy[3];
    return `${yyyy}-${mm}-${dd}`;
  }
  return dStr;
}

function toDisplayDate(dStr) {
  if (!dStr) return '';
  dStr = dStr.trim();
  const ymd = dStr.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (ymd) {
    const yyyy = ymd[1];
    const mm = ymd[2].padStart(2, '0');
    const dd = ymd[3].padStart(2, '0');
    return `${dd}-${mm}-${yyyy}`;
  }
  return dStr;
}

async function submitAddSingleStudent(e) {
  e.preventDefault();
  const pin = document.getElementById('single-pin-input').value.trim().toUpperCase();
  const admission_no = document.getElementById('single-adm-input').value.trim();
  const student_name = document.getElementById('single-name-input').value.trim();
  const father_name = document.getElementById('single-father-input').value.trim();
  const dob = toDisplayDate(document.getElementById('single-dob-input').value);
  const date_of_admission = toDisplayDate(document.getElementById('single-doa-input').value);
  const nationality = document.getElementById('single-nat-input').value.trim();
  const religion = document.getElementById('single-rel-input').value.trim();
  const course_branch = document.getElementById('single-student-branch-select').value;

  const res = await API.request('/clerk/students', {
    method: 'POST',
    body: {
      pin,
      admission_no,
      student_name,
      father_name,
      dob,
      date_of_admission,
      nationality,
      religion,
      course_branch
    }
  });

  if (res.ok && res.data.success) {
    API.showToast(`Student ${student_name} (${pin}) enrolled successfully.`, 'success');
    closeAddSingleStudentModal();
    loadMasterStudents('');
    loadClerkDashboard();
  } else {
    API.showToast(res.data.error || 'Failed to add student.', 'error');
  }
}

// Edit Total Student Master Data Modal
let editingMasterPin = null;

async function openEditMasterStudentModal(pin) {
  await ensureBranchesLoaded();
  let student = cachedMasterStudents.find(s => s.pin === pin);
  if (!student) {
    const res = await API.request(`/clerk/students?search=${encodeURIComponent(pin)}`);
    if (res.ok && res.data.students && res.data.students.length > 0) {
      student = res.data.students[0];
    }
  }

  if (!student) {
    API.showToast(`Could not find student data for ${pin}.`, 'error');
    return;
  }

  editingMasterPin = student.pin;
  document.getElementById('edit-master-pin').value = student.pin;
  document.getElementById('edit-master-adm').value = student.admission_no || `ADM-${student.pin}`;
  document.getElementById('edit-master-name').value = student.student_name || '';
  document.getElementById('edit-master-father').value = student.father_name || '';
  document.getElementById('edit-master-dob').value = toInputDate(student.dob || '');
  document.getElementById('edit-master-doa').value = toInputDate(student.date_of_admission || '');
  document.getElementById('edit-master-nat').value = student.nationality || 'Indian';
  document.getElementById('edit-master-rel').value = student.religion || 'Hindu';

  const select = document.getElementById('edit-master-branch');
  select.innerHTML = '';
  cachedBranches.forEach(b => {
    const opt = document.createElement('option');
    opt.value = b.name;
    opt.innerText = `${b.name} (${b.code})`;
    if (b.name.toLowerCase() === (student.course_branch || '').toLowerCase() || b.code.toLowerCase() === (student.course_branch || '').toLowerCase()) {
      opt.selected = true;
    }
    select.appendChild(opt);
  });

  document.getElementById('modal-edit-master-student').style.display = 'flex';
}

function closeEditMasterStudentModal() {
  document.getElementById('modal-edit-master-student').style.display = 'none';
  editingMasterPin = null;
}

async function submitEditMasterStudent(e) {
  e.preventDefault();
  if (!editingMasterPin) return;

  const admission_no = document.getElementById('edit-master-adm').value.trim();
  const student_name = document.getElementById('edit-master-name').value.trim();
  const father_name = document.getElementById('edit-master-father').value.trim();
  const dob = toDisplayDate(document.getElementById('edit-master-dob').value);
  const date_of_admission = toDisplayDate(document.getElementById('edit-master-doa').value);
  const nationality = document.getElementById('edit-master-nat').value.trim();
  const religion = document.getElementById('edit-master-rel').value.trim();
  const course_branch = document.getElementById('edit-master-branch').value;

  const res = await API.request(`/clerk/students/${encodeURIComponent(editingMasterPin)}`, {
    method: 'PUT',
    body: {
      admission_no,
      student_name,
      father_name,
      dob,
      date_of_admission,
      nationality,
      religion,
      course_branch
    }
  });

  if (res.ok && res.data.success) {
    API.showToast(`Student ${editingMasterPin} master records updated successfully.`, 'success');

    closeEditMasterStudentModal();
    loadMasterStudents();
    loadCertificateStudents();
  } else {
    API.showToast(res.data.error || 'Failed to update student master data.', 'error');
  }
}

async function ensureBranchesLoaded() {
  if (!cachedBranches || cachedBranches.length === 0) {
    const res = await API.request('/clerk/branches');
    if (res.ok && res.data.branches) {
      cachedBranches = res.data.branches;
    }
  }
}

// --- CERTIFICATES TAB ---
async function loadCertificateStudents() {
  const res = await API.request('/clerk/certificates/students');
  if (!res.ok) {
    API.showToast(res.data.error || 'Failed to load students for certificates.', 'error');
    return;
  }

  const students = res.data.students || [];
  const tbody = document.getElementById('cert-students-body');
  tbody.innerHTML = '';

  if (students.length === 0) {
    tbody.innerHTML = '<tr><td colspan="9" style="text-align:center; color:var(--text-muted); padding:2rem;">No students found in master records.</td></tr>';
    return;
  }

  students.forEach(st => {
    const tr = document.createElement('tr');

    const isCompleted = st.no_dues_status === 'Completed';
    const isLocked = st.is_locked === 1;
    const hasGenerated = !!st.current_version;

    // Status Badges
    const duesBadge = isCompleted 
      ? '<span class="badge badge-approved">Completed</span>' 
      : '<span class="badge badge-pending">In Progress</span>';

    const lockBadge = isLocked
      ? '<span class="badge badge-approved" title="Verified &amp; Locked">🔒 Locked</span>'
      : '<span class="badge badge-pending" title="Draft / Unlocked">Draft</span>';

    const versionText = hasGenerated
      ? `<span class="badge badge-info">v${st.current_version} (${st.generated_date})</span>`
      : '<span style="color:var(--text-muted); font-size:0.8rem;">Not Generated</span>';

    // Actions
    let actionButtons = '';
    if (!isLocked) {
      actionButtons += `
        <button class="btn btn-sm btn-secondary" onclick="openEditCertModal('${st.pin}', '${st.student_name.replace(/'/g, "\\'")}', '${st.date_of_leaving || ''}', '${st.fees_paid || 'No'}', '${(st.promotion_status || '').replace(/'/g, "\\'")}', '${st.conduct_character || 'Good'}')">
          Edit Data
        </button>
      `;
      if (isCompleted) {
        actionButtons += `
          <button class="btn btn-sm btn-success" style="margin-left:0.3rem;" onclick="verifyAndLock('${st.pin}')">
            Lock &amp; Verify
          </button>
        `;
      } else if (st.no_dues_status === 'Pending') {
        actionButtons += `
          <button class="btn btn-sm btn-primary" style="margin-left:0.3rem;" onclick="fastTrackApproveAllDues('${st.pin}')" title="Approve all 12 department and lab clearances instantly">
            ⚡ Clear All (12)
          </button>
        `;
      }
    } else {
      // Locked
      actionButtons += `
        <button class="btn btn-sm btn-primary" onclick="generateCertificate('${st.pin}')">
          📜 Generate
        </button>
        <button class="btn btn-sm btn-secondary" style="margin-left:0.3rem;" onclick="unlockCertificate('${st.pin}')">
          🔓 Unlock
        </button>
      `;
    }

    if (hasGenerated) {
      actionButtons += `
        <a href="certificate-view.html?pin=${encodeURIComponent(st.pin)}" target="_blank" class="btn btn-sm btn-secondary" style="margin-left:0.3rem;">
          🖨️ Print
        </a>
        <button class="btn btn-sm btn-secondary" style="margin-left:0.3rem;" onclick="viewAuditHistory('${st.pin}')">
          History
        </button>
      `;
    }

    tr.innerHTML = `
      <td style="font-family:var(--font-mono); font-weight:bold; color:var(--accent-gold);">${st.pin}</td>
      <td><strong>${st.student_name}</strong></td>
      <td style="color:var(--text-secondary);">${st.course_branch}</td>
      <td>${duesBadge}</td>
      <td>${st.date_of_leaving || '-'}</td>
      <td>${st.fees_paid || '-'}</td>
      <td>${lockBadge}</td>
      <td>${versionText}</td>
      <td style="white-space:nowrap;">${actionButtons}</td>
    `;

    tbody.appendChild(tr);
  });
}

function openEditCertModal(pin, name, leavingDate, feesPaid, promoStatus, conduct) {
  editingStudentPin = pin;
  document.getElementById('cert-modal-student-name').innerText = name;
  document.getElementById('cert-modal-pin').innerText = pin;
  document.getElementById('cert-date-of-leaving').value = leavingDate;
  document.getElementById('cert-fees-paid').value = feesPaid || 'No';
  document.getElementById('cert-promotion-status').value = promoStatus;

  const conductSelect = document.getElementById('cert-conduct');
  if (['Good', 'Satisfactory', 'Poor'].includes(conduct)) {
    conductSelect.value = conduct;
    toggleConductCustomInput(conduct);
  } else {
    conductSelect.value = 'Other';
    toggleConductCustomInput('Other');
    document.getElementById('cert-conduct-custom').value = conduct;
  }

  document.getElementById('modal-edit-cert').style.display = 'flex';
}

function closeEditCertModal() {
  document.getElementById('modal-edit-cert').style.display = 'none';
  editingStudentPin = null;
}

function toggleConductCustomInput(val) {
  const customGroup = document.getElementById('group-conduct-custom');
  if (val === 'Other') {
    customGroup.style.display = 'block';
  } else {
    customGroup.style.display = 'none';
  }
}

async function submitCertData(e) {
  e.preventDefault();
  if (!editingStudentPin) return;

  const date_of_leaving = document.getElementById('cert-date-of-leaving').value.trim();
  const fees_paid = document.getElementById('cert-fees-paid').value;
  const promotion_status = document.getElementById('cert-promotion-status').value.trim();
  const conductType = document.getElementById('cert-conduct').value;
  let conduct_character = conductType;

  if (conductType === 'Other') {
    const customVal = document.getElementById('cert-conduct-custom').value.trim();
    if (!customVal) {
      API.showToast('Please enter custom Conduct & Character text.', 'warning');
      return;
    }
    conduct_character = customVal;
  }

  const res = await API.request('/clerk/certificates/data', {
    method: 'POST',
    body: {
      student_pin: editingStudentPin,
      date_of_leaving,
      fees_paid,
      promotion_status,
      conduct_character
    }
  });

  if (res.ok && res.data.success) {
    API.showToast('Certificate data saved successfully.', 'success');
    closeEditCertModal();
    loadCertificateStudents();
  } else {
    API.showToast(res.data.error || 'Failed to save certificate data.', 'error');
  }
}

async function verifyAndLock(pin) {
  if (!confirm(`Perform Final Verification and Lock certificate data for PIN ${pin}?\nOnce locked, data cannot be modified without an explicit unlock action.`)) return;

  const res = await API.request('/clerk/certificates/verify-lock', {
    method: 'POST',
    body: { student_pin: pin }
  });

  if (res.ok && res.data.success) {
    API.showToast('Certificate data verified and locked. Ready for generation.', 'success');
    loadCertificateStudents();
  } else {
    API.showToast(res.data.error || 'Failed to verify and lock certificate.', 'error');
  }
}

async function unlockCertificate(pin) {
  if (!confirm(`Unlock certificate data for PIN ${pin}?\nAny new generation will increment the certificate version.`)) return;

  const res = await API.request('/clerk/certificates/unlock', {
    method: 'POST',
    body: { student_pin: pin }
  });

  if (res.ok && res.data.success) {
    API.showToast(res.data.message, 'info');
    loadCertificateStudents();
  } else {
    API.showToast(res.data.error || 'Failed to unlock certificate.', 'error');
  }
}

async function fastTrackApproveAllDues(pin) {
  if (!confirm(`Are you sure you want to approve all 12 department and laboratory clearances for student ${pin}?`)) return;

  API.showToast(`Fast-tracking all clearances for ${pin}...`, 'info');
  const res = await API.request(`/clerk/students/${encodeURIComponent(pin)}/fast-track-approve`, {
    method: 'POST'
  });

  if (res.ok && res.data.success) {
    API.showToast(res.data.message, 'success');
    loadCertificateStudents();
    loadClerkDashboard();
  } else {
    API.showToast(res.data.error || 'Failed to fast-track approvals.', 'error');
  }
}

async function generateCertificate(pin) {
  const res = await API.request('/clerk/certificates/generate', {
    method: 'POST',
    body: { student_pin: pin }
  });

  if (res.ok && res.data.success) {
    API.showToast(`Certificate v${res.data.version} generated successfully!`, 'success');
    loadCertificateStudents();
    loadClerkDashboard();
    window.open(`certificate-view.html?pin=${encodeURIComponent(pin)}`, '_blank');
  } else {
    API.showToast(res.data.error || 'Failed to generate certificate.', 'error');
  }
}

async function viewAuditHistory(pin) {
  document.getElementById('audit-modal-pin').innerText = pin;
  const tbody = document.getElementById('audit-table-body');
  tbody.innerHTML = '<tr><td colspan="5">Loading history...</td></tr>';
  document.getElementById('modal-audit-history').style.display = 'flex';

  const res = await API.request(`/clerk/certificates/audit/${encodeURIComponent(pin)}`);
  if (res.ok && res.data.history) {
    tbody.innerHTML = '';
    res.data.history.forEach(h => {
      const tr = document.createElement('tr');
      const isCurr = h.is_current === 1;
      tr.innerHTML = `
        <td><strong>v${h.version_number}</strong></td>
        <td>${h.generated_date}</td>
        <td>${h.generated_by}</td>
        <td>${isCurr ? '<span class="badge badge-approved">Current Active</span>' : '<span class="badge badge-pending">Superseded</span>'}</td>
        <td>
          <a href="certificate-view.html?pin=${encodeURIComponent(pin)}&version=${h.version_number}" target="_blank" class="btn btn-sm btn-secondary">
            View Copy
          </a>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }
}

function closeAuditModal() {
  document.getElementById('modal-audit-history').style.display = 'none';
}

// --- PHYSICAL CLEARANCES TAB ---
async function loadPhysicalDeptsDropdown() {
  const res = await API.request('/clerk/departments');
  const select = document.getElementById('phys-department-id');
  select.innerHTML = '';

  if (res.ok && res.data.departments) {
    const physical = res.data.departments.filter(d => d.type === 'Physical' || (d.name && (d.name.toUpperCase().includes('NSS') || d.name.toUpperCase().includes('NCC'))));
    if (physical.length === 0) {
      select.innerHTML = '<option value="">No Physical departments configured</option>';
      return;
    }
    physical.forEach(d => {
      const opt = document.createElement('option');
      opt.value = d.id;
      const isNcc = d.name && (d.name.toUpperCase().includes('NSS') || d.name.toUpperCase().includes('NCC'));
      opt.innerText = isNcc ? `${d.name} (Non-Cadet Approvals)` : d.name;
      select.appendChild(opt);
    });
  }
}


async function recordPhysicalClearance(e) {
  e.preventDefault();
  const student_pin = document.getElementById('phys-student-pin').value.trim();
  const department_id = document.getElementById('phys-department-id').value;

  if (!student_pin || !department_id) return;

  const btn = document.getElementById('btn-save-physical');
  btn.disabled = true;

  const res = await API.request('/clerk/departments/physical-approval', {
    method: 'POST',
    body: { student_pin, department_id }
  });

  btn.disabled = false;

  if (res.ok && res.data.success) {
    API.showToast(res.data.message, 'success');
    document.getElementById('phys-student-pin').value = '';
    loadClerkDashboard();
  } else {
    API.showToast(res.data.error || 'Failed to record physical clearance.', 'error');
  }
}

// --- FACULTY ACCOUNTS TAB ---
let cachedFacultyAccounts = [];
let currentFacultyFilter = 'ALL_FILTER';
let changingFacultyScopeId = null;

async function loadFacultyAccounts() {
  const tbody = document.getElementById('faculty-accounts-body');
  if (!tbody) return;

  const res = await API.request('/clerk/faculty-accounts');
  if (res.ok && res.data.faculty) {
    cachedFacultyAccounts = res.data.faculty;
    renderFacultyAccounts();
  }
}

function filterFacultyScope(filterType) {
  currentFacultyFilter = filterType;
  // Update active state of filter buttons
  const btnAll = document.getElementById('fac-filter-all');
  const btnCommon = document.getElementById('fac-filter-common');
  const btnBranch = document.getElementById('fac-filter-branch');

  if (btnAll) {
    btnAll.className = filterType === 'ALL_FILTER' ? 'btn btn-sm btn-primary' : 'btn btn-sm btn-secondary';
  }
  if (btnCommon) {
    btnCommon.className = filterType === 'COMMON' ? 'btn btn-sm btn-primary' : 'btn btn-sm btn-secondary';
  }
  if (btnBranch) {
    btnBranch.className = filterType === 'BRANCH' ? 'btn btn-sm btn-primary' : 'btn btn-sm btn-secondary';
  }

  renderFacultyAccounts();
}

function renderFacultyAccounts() {
  const tbody = document.getElementById('faculty-accounts-body');
  if (!tbody) return;

  tbody.innerHTML = '';

  let list = cachedFacultyAccounts;
  if (currentFacultyFilter === 'COMMON') {
    list = list.filter(f => f.branch_code === 'ALL' || f.is_common);
  } else if (currentFacultyFilter === 'BRANCH') {
    list = list.filter(f => f.branch_code !== 'ALL' && !f.is_common);
  }

  if (list.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; color:var(--text-muted); padding:1.5rem;">No faculty accounts match the selected filter.</td></tr>';
    return;
  }

  list.forEach((f, index) => {
    const tr = document.createElement('tr');
    const isActive = f.is_active === 1;
    const deptName = f.department_name || 'Department';
    const deptType = f.department_type || 'Online';
    const isCommon = f.branch_code === 'ALL' || f.is_common;
    const branchCode = f.branch_code || 'ALL';

    const scopeBadge = isCommon
      ? '<span class="badge badge-info" style="font-size:0.78rem;">🌐 Common (All Branches)</span>'
      : `<span class="badge badge-approved" style="font-family:var(--font-mono); font-size:0.78rem;">🏛️ ${escapeHtml(branchCode)}</span>`;

    // Scope toggle button: If Common -> button to Make Branch Separated; If Branch -> button to Make Common
    const scopeBtn = isCommon
      ? `<button class="btn btn-sm btn-outline" style="font-size:0.75rem; padding:0.25rem 0.5rem;" onclick="openSetFacultyScopeModal(${f.id})">
           🏛️ Make Branch Separated
         </button>`
      : `<button class="btn btn-sm btn-outline" style="font-size:0.75rem; padding:0.25rem 0.5rem;" onclick="makeFacultyCommon(${f.id})">
           🌐 Make Common
         </button>`;

    tr.innerHTML = `
      <td style="font-weight:600; color:var(--text-muted);">${index + 1}</td>
      <td><strong>${escapeHtml(deptName)}</strong></td>
      <td>${scopeBadge}</td>
      <td><span class="badge ${deptType === 'Online' ? 'badge-info' : 'badge-pending'}">${escapeHtml(deptType)}</span></td>
      <td style="font-family:var(--font-mono); color:var(--accent-gold); font-weight:bold;">${escapeHtml(f.username)}</td>
      <td>${isActive ? '<span class="badge badge-approved">Active</span>' : '<span class="badge badge-due">Inactive</span>'}</td>
      <td>${scopeBtn}</td>
      <td>
        <button class="btn btn-sm btn-secondary" style="padding:0.25rem 0.5rem; font-size:0.78rem;" onclick="openResetPassModal(${f.id})">
          Reset Password
        </button>
        <button class="btn btn-sm ${isActive ? 'btn-danger' : 'btn-success'}" style="margin-left:0.3rem; padding:0.25rem 0.5rem; font-size:0.78rem;" onclick="toggleFacultyStatus(${f.id}, ${!isActive})">
          ${isActive ? 'Deactivate' : 'Activate'}
        </button>
        <button class="btn btn-sm btn-danger" style="margin-left:0.3rem; padding:0.25rem 0.5rem; font-size:0.78rem; background:#dc2626;" onclick="deleteFacultyAccount(${f.id})">
          🗑️ Delete
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

async function deleteFacultyAccount(id) {
  const f = (cachedFacultyAccounts || []).find(x => Number(x.id) === Number(id));
  const username = f ? f.username : `Faculty #${id}`;
  if (!confirm(`⚠️ Are you sure you want to permanently delete faculty account "${username}"?\nThis action cannot be undone.`)) {
    return;
  }

  const res = await API.request(`/clerk/faculty-accounts/${id}`, {
    method: 'DELETE'
  });

  if (res.ok && res.data.success) {
    API.showToast(res.data.message || `Faculty account "${username}" deleted.`, 'success');
    await loadFacultyAccounts();
    await loadClerkDashboard();
  } else {
    API.showToast(res.data.error || 'Failed to delete faculty account.', 'error');
  }
}

async function makeFacultyCommon(id) {
  const f = (cachedFacultyAccounts || []).find(x => Number(x.id) === Number(id));
  const username = f ? f.username : `Faculty #${id}`;
  if (!confirm(`Are you sure you want to make faculty "${username}" COMMON to all diploma branches?`)) {
    return;
  }

  const res = await API.request(`/clerk/faculty-accounts/${id}/scope`, {
    method: 'PATCH',
    body: { branch_code: 'ALL' }
  });

  if (res.ok && res.data.success) {
    API.showToast(res.data.message || 'Faculty scope set to Common (All Branches)!', 'success');
    await loadFacultyAccounts();
    await loadDepartments();
    await loadClerkDashboard();
  } else {
    API.showToast(res.data.error || 'Failed to update faculty scope.', 'error');
  }
}

async function openSetFacultyScopeModal(id) {
  changingFacultyScopeId = id;
  changingDeptScopeId = null;
  const f = (cachedFacultyAccounts || []).find(x => Number(x.id) === Number(id));
  const username = f ? f.username : `Faculty #${id}`;
  const currentBranch = f ? (f.branch_code || 'ALL') : 'ALL';

  const userEl = document.getElementById('scope-fac-username');
  if (userEl) userEl.innerText = username;

  const select = document.getElementById('scope-branch-select');
  select.innerHTML = '';

  // Fetch current branches
  const res = await API.request('/clerk/branches');
  const branches = (res.ok && res.data.branches) || cachedBranches || [];

  branches.forEach(b => {
    const opt = document.createElement('option');
    opt.value = b.code;
    opt.innerText = `${b.code} - ${b.name}`;
    if (b.code === currentBranch) opt.selected = true;
    select.appendChild(opt);
  });

  document.getElementById('modal-set-faculty-scope').style.display = 'flex';
}

function closeSetFacultyScopeModal() {

  document.getElementById('modal-set-faculty-scope').style.display = 'none';
  changingFacultyScopeId = null;
  changingDeptScopeId = null;
}

async function submitSetFacultyScope(e) {
  e.preventDefault();
  const branch_code = document.getElementById('scope-branch-select').value;

  if (changingDeptScopeId) {
    const res = await API.request(`/clerk/departments/${changingDeptScopeId}`, {
      method: 'PUT',
      body: { name: changingDeptScopeName, branch_code, type: changingDeptScopeType, is_active: 1 }
    });

    if (res.ok && res.data.success) {
      API.showToast(`Department "${changingDeptScopeName}" scope set to branch ${branch_code}!`, 'success');
      closeSetFacultyScopeModal();
      changingDeptScopeId = null;
      await loadDepartments();
      await loadFacultyAccounts();
      await loadClerkDashboard();
    } else {
      API.showToast(res.data.error || 'Failed to update department branch scope.', 'error');
    }
    return;
  }

  if (!changingFacultyScopeId) return;

  const res = await API.request(`/clerk/faculty-accounts/${changingFacultyScopeId}/scope`, {
    method: 'PATCH',
    body: { branch_code }
  });

  if (res.ok && res.data.success) {
    API.showToast(res.data.message || `Faculty scope set to branch ${branch_code}!`, 'success');
    closeSetFacultyScopeModal();
    await loadFacultyAccounts();
    await loadDepartments();
    await loadClerkDashboard();
  } else {
    API.showToast(res.data.error || 'Failed to update faculty branch scope.', 'error');
  }
}

async function openCreateFacultyModal() {
  const res = await API.request('/clerk/departments');
  const select = document.getElementById('new-fac-dept');
  select.innerHTML = '';

  if (res.ok && res.data.departments) {
    res.data.departments.forEach(d => {
      const opt = document.createElement('option');
      opt.value = d.id;
      const bCode = d.branch_code || 'ALL';
      opt.innerText = `${d.name} (${d.type} - ${bCode === 'ALL' ? 'Common' : bCode})`;
      select.appendChild(opt);
    });
  }

  document.getElementById('modal-create-faculty').style.display = 'flex';
}

function closeCreateFacultyModal() {
  document.getElementById('modal-create-faculty').style.display = 'none';
}

async function submitCreateFaculty(e) {
  e.preventDefault();
  const department_id = document.getElementById('new-fac-dept').value;
  const username = document.getElementById('new-fac-username').value.trim();
  const password = document.getElementById('new-fac-password').value;

  const res = await API.request('/clerk/faculty-accounts', {
    method: 'POST',
    body: { department_id, username, password }
  });

  if (res.ok && res.data.success) {
    API.showToast('Faculty account created successfully.', 'success');
    closeCreateFacultyModal();
    await loadFacultyAccounts();
    await loadClerkDashboard();
  } else {
    API.showToast(res.data.error || 'Failed to create faculty account.', 'error');
  }
}

async function toggleFacultyStatus(id, newStatus) {
  const res = await API.request(`/clerk/faculty-accounts/${id}/status`, {
    method: 'PATCH',
    body: { is_active: newStatus }
  });

  if (res.ok && res.data.success) {
    API.showToast('Faculty account status updated.', 'success');
    await loadFacultyAccounts();
    await loadClerkDashboard();
  } else {
    API.showToast(res.data.error || 'Failed to update faculty status.', 'error');
  }
}


function openResetPassModal(id) {
  resettingFacultyId = id;
  const f = (cachedFacultyAccounts || []).find(x => Number(x.id) === Number(id));
  const username = f ? f.username : `Faculty #${id}`;
  const el = document.getElementById('reset-fac-username');
  if (el) el.innerText = username;
  document.getElementById('reset-new-password').value = '';
  document.getElementById('modal-reset-faculty-pass').style.display = 'flex';
}


function closeResetPassModal() {
  document.getElementById('modal-reset-faculty-pass').style.display = 'none';
  resettingFacultyId = null;
}

async function submitResetFacultyPassword(e) {
  e.preventDefault();
  if (!resettingFacultyId) return;

  const newPassword = document.getElementById('reset-new-password').value;
  const res = await API.request(`/clerk/faculty-accounts/${resettingFacultyId}/reset-password`, {
    method: 'POST',
    body: { newPassword }
  });

  if (res.ok && res.data.success) {
    API.showToast('Password updated successfully.', 'success');
    closeResetPassModal();
  } else {
    API.showToast(res.data.error || 'Failed to reset password.', 'error');
  }
}

// --- BRANCHES & DEPARTMENTS TAB ---

async function loadBranches() {
  const res = await API.request('/clerk/branches');
  const tbody = document.getElementById('branches-table-body');
  const chips = document.getElementById('branches-chips-container');
  const deptSelect = document.getElementById('dept-branch-select');
  const filterSelect = document.getElementById('filter-dept-branch');

  tbody.innerHTML = '';
  chips.innerHTML = '';

  if (res.ok && res.data.branches) {
    cachedBranches = res.data.branches;

    // Reset dropdowns
    if (deptSelect) deptSelect.innerHTML = '<option value="ALL">All Branches (Common: Library, Accounts, Hostel, etc.)</option>';
    if (filterSelect) filterSelect.innerHTML = '<option value="ALL">Filter: All Branches &amp; Common</option>';

    cachedBranches.forEach(b => {
      // 1. Branch Chip
      const chip = document.createElement('div');
      chip.className = 'user-badge';
      chip.style.borderColor = b.is_active ? 'var(--border-highlight)' : 'var(--status-due)';
      chip.innerHTML = `
        <strong style="color:var(--accent-gold);">${escapeHtml(b.code)}</strong>: ${escapeHtml(b.name)}
        ${!b.is_active ? '<span style="color:var(--status-due); font-size:0.7rem; margin-left:0.3rem;">(Inactive)</span>' : ''}
      `;
      chips.appendChild(chip);

      // 2. Populate Dropdowns
      if (deptSelect) {
        const opt1 = document.createElement('option');
        opt1.value = b.code;
        opt1.innerText = `${b.code} - ${b.name}`;
        deptSelect.appendChild(opt1);
      }

      if (filterSelect) {
        const opt2 = document.createElement('option');
        opt2.value = b.code;
        opt2.innerText = `Branch: ${b.code} (${b.name})`;
        filterSelect.appendChild(opt2);
      }

      // 3. Table Row
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="font-family:var(--font-mono); font-weight:bold; color:var(--accent-gold);">${escapeHtml(b.code)}</td>
        <td><strong>${escapeHtml(b.name)}</strong></td>
        <td>${b.is_active ? '<span class="badge badge-approved">Active</span>' : '<span class="badge badge-due">Inactive</span>'}</td>
        <td>
          <button class="btn btn-sm ${b.is_active ? 'btn-danger' : 'btn-success'}" onclick="toggleBranchStatus(${b.id}, ${!b.is_active})">
            ${b.is_active ? 'Deactivate' : 'Activate'}
          </button>
          <button class="btn btn-sm btn-danger" style="margin-left:0.3rem; background:#dc2626;" onclick="deleteBranch(${b.id})">
            🗑️ Delete
          </button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }
}

async function deleteBranch(id) {
  const b = (cachedBranches || []).find(x => Number(x.id) === Number(id));
  const name = b ? b.name : `Branch #${id}`;
  const code = b ? b.code : `Branch #${id}`;
  if (!confirm(`⚠️ Are you sure you want to permanently delete diploma branch "${name}" (${code})?\nThis action cannot be undone.`)) {
    return;
  }

  const res = await API.request(`/clerk/branches/${id}`, {
    method: 'DELETE'
  });

  if (res.ok && res.data.success) {
    API.showToast(res.data.message || `Branch "${code}" deleted.`, 'success');
    await loadBranches();
    await loadDepartments();
    await loadClerkDashboard();
  } else {
    API.showToast(res.data.error || 'Failed to delete branch.', 'error');
  }
}


function openAddBranchModal() {
  document.getElementById('branch-code-input').value = '';
  document.getElementById('branch-name-input').value = '';
  document.getElementById('modal-add-branch').style.display = 'flex';
}

function closeAddBranchModal() {
  document.getElementById('modal-add-branch').style.display = 'none';
}

async function submitAddBranch(e) {
  e.preventDefault();
  const code = document.getElementById('branch-code-input').value.trim().toUpperCase();
  const name = document.getElementById('branch-name-input').value.trim();

  const res = await API.request('/clerk/branches', {
    method: 'POST',
    body: { code, name }
  });

  if (res.ok && res.data.success) {
    API.showToast(`Branch ${name} (${code}) created successfully!`, 'success');
    closeAddBranchModal();
    await loadBranches();
    await loadDepartments();
  } else {
    API.showToast(res.data.error || 'Failed to create branch.', 'error');
  }
}

async function toggleBranchStatus(id, newStatus) {
  const res = await API.request(`/clerk/branches/${id}/status`, {
    method: 'PATCH',
    body: { is_active: newStatus }
  });

  if (res.ok && res.data.success) {
    API.showToast('Branch status updated.', 'success');
    await loadBranches();
    await loadDepartments();
  } else {
    API.showToast(res.data.error || 'Failed to update branch status.', 'error');
  }
}

// --- DEPARTMENTS MANAGEMENT ---
async function loadDepartments() {
  const res = await API.request('/clerk/departments');
  if (res.ok && res.data.departments) {
    cachedDepartments = res.data.departments;
    const filterEl = document.getElementById('filter-dept-branch');
    const currentFilter = (filterEl && filterEl.value) || 'ALL';
    filterDeptsByBranch(currentFilter);
  }
}

function filterDeptsByBranch(branchCode) {
  if (!cachedDepartments || cachedDepartments.length === 0) return;
  const tbody = document.getElementById('departments-table-body');
  if (!tbody) return;
  tbody.innerHTML = '';

  let deptsToShow = cachedDepartments;
  if (branchCode && branchCode !== 'ALL') {
    deptsToShow = cachedDepartments.filter(d => (d.branch_code || 'ALL') === branchCode || (d.branch_code || 'ALL') === 'ALL');
  }

  if (deptsToShow.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:var(--text-muted); padding:1.5rem;">No departments found for this filter.</td></tr>';
    return;
  }

  deptsToShow.forEach((d, index) => {
    const tr = document.createElement('tr');
    const bCode = d.branch_code || 'ALL';
    const branchBadge = bCode === 'ALL'
      ? '<span class="badge badge-info">All Branches (Common)</span>'
      : `<span class="badge badge-approved" style="font-family:var(--font-mono);">${escapeHtml(bCode)}</span>`;

    const isCommon = bCode === 'ALL';
    const scopeBtn = isCommon
      ? `<button class="btn btn-sm btn-outline" style="font-size:0.75rem; padding:0.2rem 0.4rem;" onclick="openSetDeptScopeModal(${d.id})">
           🏛️ Set Branch
         </button>`
      : `<button class="btn btn-sm btn-outline" style="font-size:0.75rem; padding:0.2rem 0.4rem;" onclick="makeDeptCommon(${d.id})">
           🌐 Make Common
         </button>`;

    tr.innerHTML = `
      <td style="font-weight:600; color:var(--text-muted);">${index + 1}</td>
      <td><strong>${escapeHtml(d.name)}</strong></td>
      <td>${branchBadge} <span style="margin-left:0.3rem;">${scopeBtn}</span></td>
      <td><span class="badge ${d.type === 'Online' ? 'badge-info' : 'badge-pending'}">${escapeHtml(d.type)}</span></td>
      <td>${d.is_active ? '<span class="badge badge-approved">Active</span>' : '<span class="badge badge-due">Inactive</span>'}</td>
      <td>
        <button class="btn btn-sm btn-secondary" style="font-size:0.75rem; padding:0.25rem 0.5rem;" onclick="toggleDeptType(${d.id})">
          Switch to ${d.type === 'Online' ? 'Physical' : 'Online'}
        </button>
        <button class="btn btn-sm btn-danger" style="margin-left:0.3rem; font-size:0.75rem; padding:0.25rem 0.5rem; background:#dc2626;" onclick="deleteDepartment(${d.id})">
          🗑️ Delete
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

async function deleteDepartment(id) {
  const dept = (cachedDepartments || []).find(x => Number(x.id) === Number(id));
  const name = dept ? dept.name : `Department #${id}`;
  if (!confirm(`⚠️ Are you sure you want to permanently delete department "${name}"?\nAny assigned faculty incharge login account for this department will also be removed.\nThis action cannot be undone.`)) {
    return;
  }

  const res = await API.request(`/clerk/departments/${id}`, {
    method: 'DELETE'
  });

  if (res.ok && res.data.success) {
    API.showToast(res.data.message || `Department "${name}" deleted.`, 'success');
    await loadDepartments();
    await loadFacultyAccounts();
    await loadClerkDashboard();
  } else {
    API.showToast(res.data.error || 'Failed to delete department.', 'error');
  }
}

async function makeDeptCommon(id) {
  const dept = (cachedDepartments || []).find(x => Number(x.id) === Number(id));
  const name = dept ? dept.name : `Department #${id}`;
  const type = dept ? dept.type : 'Online';
  if (!confirm(`Are you sure you want to make department "${name}" COMMON to all diploma branches?`)) return;

  const res = await API.request(`/clerk/departments/${id}`, {
    method: 'PUT',
    body: { name, branch_code: 'ALL', type, is_active: 1 }
  });

  if (res.ok && res.data.success) {
    API.showToast(`Department "${name}" is now Common to all branches.`, 'success');
    await loadDepartments();
    await loadFacultyAccounts();
    await loadClerkDashboard();
  } else {
    API.showToast(res.data.error || 'Failed to update department scope.', 'error');
  }
}

let changingDeptScopeId = null;
let changingDeptScopeName = '';
let changingDeptScopeType = '';

function openSetDeptScopeModal(id) {
  changingDeptScopeId = id;
  changingFacultyScopeId = null;
  const dept = (cachedDepartments || []).find(x => Number(x.id) === Number(id));
  const name = dept ? dept.name : `Department #${id}`;
  const type = dept ? dept.type : 'Online';
  const currentBranch = dept ? (dept.branch_code || 'ALL') : 'ALL';

  changingDeptScopeName = name;
  changingDeptScopeType = type;

  const select = document.getElementById('scope-branch-select');
  select.innerHTML = '';

  (cachedBranches || []).forEach(b => {
    const opt = document.createElement('option');
    opt.value = b.code;
    opt.innerText = `${b.code} - ${b.name}`;
    if (b.code === currentBranch) opt.selected = true;
    select.appendChild(opt);
  });

  const userEl = document.getElementById('scope-fac-username');
  if (userEl) userEl.innerText = `Department: ${name}`;

  document.getElementById('modal-set-faculty-scope').style.display = 'flex';
}

function openAddDeptModal() {
  document.getElementById('dept-name-input').value = '';
  document.getElementById('dept-branch-select').value = 'ALL';
  document.getElementById('dept-type-select').value = 'Online';
  document.getElementById('modal-add-dept').style.display = 'flex';
}

function closeAddDeptModal() {
  document.getElementById('modal-add-dept').style.display = 'none';
}

async function submitAddDepartment(e) {
  e.preventDefault();
  const name = document.getElementById('dept-name-input').value.trim();
  const branch_code = document.getElementById('dept-branch-select').value;
  const type = document.getElementById('dept-type-select').value;

  const res = await API.request('/clerk/departments', {
    method: 'POST',
    body: { name, branch_code, type }
  });

  if (res.ok && res.data.success) {
    API.showToast(res.data.message || 'Department created.', 'success');
    closeAddDeptModal();
    await loadDepartments();
    await loadClerkDashboard();
  } else {
    API.showToast(res.data.error || 'Failed to add department.', 'error');
  }
}

async function toggleDeptType(id) {
  const dept = (cachedDepartments || []).find(x => Number(x.id) === Number(id));
  if (!dept) return;
  const newType = dept.type === 'Online' ? 'Physical' : 'Online';
  const res = await API.request(`/clerk/departments/${id}`, {
    method: 'PUT',
    body: {
      name: dept.name,
      branch_code: dept.branch_code || 'ALL',
      type: newType,
      is_active: dept.is_active
    }
  });

  if (res.ok && res.data.success) {
    API.showToast(`Department "${dept.name}" switched to ${newType}.`, 'success');
    await loadDepartments();
    await loadFacultyAccounts();
    await loadClerkDashboard();
  } else {
    API.showToast(res.data.error || 'Failed to update department.', 'error');
  }
}

// Window global bindings for all HTML onclick handlers
window.makeFacultyCommon = makeFacultyCommon;
window.deleteFacultyAccount = deleteFacultyAccount;
window.openSetFacultyScopeModal = openSetFacultyScopeModal;
window.closeSetFacultyScopeModal = closeSetFacultyScopeModal;
window.submitSetFacultyScope = submitSetFacultyScope;
window.openCreateFacultyModal = openCreateFacultyModal;
window.closeCreateFacultyModal = closeCreateFacultyModal;
window.submitCreateFaculty = submitCreateFaculty;
window.toggleFacultyStatus = toggleFacultyStatus;
window.openResetPassModal = openResetPassModal;
window.closeResetPassModal = closeResetPassModal;
window.submitResetFacultyPassword = submitResetFacultyPassword;
window.filterFacultyScope = filterFacultyScope;
window.loadBranches = loadBranches;
window.toggleBranchStatus = toggleBranchStatus;
window.deleteBranch = deleteBranch;
window.openAddBranchModal = openAddBranchModal;
window.closeAddBranchModal = closeAddBranchModal;
window.submitAddBranch = submitAddBranch;
window.loadDepartments = loadDepartments;
window.filterDeptsByBranch = filterDeptsByBranch;
window.openSetDeptScopeModal = openSetDeptScopeModal;
window.makeDeptCommon = makeDeptCommon;
window.toggleDeptType = toggleDeptType;
window.deleteDepartment = deleteDepartment;
window.openAddDeptModal = openAddDeptModal;
window.closeAddDeptModal = closeAddDeptModal;
window.submitAddDepartment = submitAddDepartment;
window.deleteSingleStudent = deleteSingleStudent;
window.purgeAllStudentData = purgeAllStudentData;



