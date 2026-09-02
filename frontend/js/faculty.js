// Faculty Incharge Portal JavaScript

let currentRequests = [];
let activeDueStudentPin = null;

document.addEventListener('DOMContentLoaded', () => {
  initCollegeBranding();
  checkAuthAndInit();
  setupLoginListener();
});

function initCollegeBranding() {
  if (window.APP_CONFIG && window.APP_CONFIG.COLLEGE) {
    const titleEl = document.getElementById('college-name-display');
    const crestEl = document.getElementById('college-crest-img');
    if (titleEl) titleEl.innerText = window.APP_CONFIG.COLLEGE.NAME;
    if (crestEl) crestEl.src = window.APP_CONFIG.COLLEGE.LOGO_PATH;
  }
}

function checkAuthAndInit() {
  const user = API.getUser();
  const token = API.getToken();

  if (token && user && user.role === 'faculty') {
    showDashboard(user);
  } else {
    showAuth();
  }
}

function showAuth() {
  document.getElementById('auth-section').style.display = 'block';
  document.getElementById('dashboard-section').style.display = 'none';
  document.getElementById('faculty-logged-in-badge').style.display = 'none';
}

function showDashboard(user) {
  document.getElementById('auth-section').style.display = 'none';
  document.getElementById('dashboard-section').style.display = 'block';

  const badge = document.getElementById('faculty-logged-in-badge');
  badge.style.display = 'flex';
  document.getElementById('faculty-badge-dept').innerText = user.department_name || 'Department';
  document.getElementById('faculty-badge-user').innerText = user.username || '';
  document.getElementById('dept-heading').innerText = `${user.department_name} Clearance Queue`;

  loadFacultyDashboard();
}

function setupLoginListener() {
  const form = document.getElementById('faculty-login-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('faculty-username').value.trim();
    const password = document.getElementById('faculty-password').value;

    const btn = document.getElementById('btn-faculty-login');
    btn.disabled = true;
    btn.innerText = 'Signing In...';

    const res = await API.request('/auth/faculty/login', {
      method: 'POST',
      body: { username, password }
    });

    btn.disabled = false;
    btn.innerText = 'Sign In to Department Queue';

    if (res.ok && res.data.success) {
      API.setAuth(res.data.token, { ...res.data.faculty, role: 'faculty' });
      API.showToast(`Welcome, ${res.data.faculty.department_name} Incharge!`, 'success');
      showDashboard(res.data.faculty);
    } else {
      API.showToast(res.data.error || 'Authentication failed.', 'error');
    }
  });
}


async function loadFacultyDashboard() {
  const res = await API.request('/faculty/dashboard');
  if (!res.ok) {
    API.showToast(res.data.error || 'Failed to load department submissions.', 'error');
    return;
  }

  const data = res.data;
  currentRequests = data.requests || [];

  // Update stats
  const stats = data.stats || {};
  document.getElementById('stat-pending').innerText = stats.pending_requests || 0;
  document.getElementById('stat-dues').innerText = stats.active_dues || 0;
  document.getElementById('stat-approved').innerText = stats.approved_requests || 0;
  document.getElementById('stat-cleared').innerText = stats.cleared_dues || 0;
  
  // Notification badge
  const badgeCount = stats.notification_badge_count || 0;
  const navBadge = document.getElementById('nav-notification-badge');
  if (navBadge) {
    navBadge.innerText = badgeCount;
    navBadge.style.display = badgeCount > 0 ? 'inline-flex' : 'none';
  }

  const tabPending = document.getElementById('tab-badge-pending');
  if (tabPending) tabPending.innerText = stats.pending_requests || 0;
  const tabDues = document.getElementById('tab-badge-dues');
  if (tabDues) tabDues.innerText = stats.active_dues || 0;

  renderRequestsTable(currentRequests);
}

function renderRequestsTable(list) {
  const tbody = document.getElementById('requests-table-body');
  tbody.innerHTML = '';

  if (!list || list.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align: center; color: var(--text-muted); padding: 2rem;">
          No student submissions found for this department.
        </td>
      </tr>
    `;
    return;
  }

  list.forEach(req => {
    const tr = document.createElement('tr');
    
    let statusBadge = '';
    if (req.clearance_status === 'Approved') {
      statusBadge = '<span class="badge badge-approved">Approved</span>';
    } else if (req.clearance_status === 'Due Found') {
      statusBadge = '<span class="badge badge-due">Due Found</span>';
    } else {
      statusBadge = '<span class="badge badge-pending">Pending Review</span>';
    }

    // Format Dues List
    let duesContent = '<span style="color:var(--text-muted); font-size:0.8rem;">No active dues</span>';
    if (req.active_dues && req.active_dues.length > 0) {
      duesContent = `
        <div style="display:flex; flex-direction:column; gap:0.3rem;">
          ${req.active_dues.map(d => `
            <div style="font-size:0.78rem; background:var(--status-due-bg); border:1px solid rgba(239,68,68,0.25); padding:0.25rem 0.5rem; border-radius:4px; display:flex; justify-content:space-between; align-items:center; gap:0.5rem;">
              <span>• ${d.reason}</span>
              <button class="btn btn-sm btn-secondary" style="padding:0.15rem 0.4rem; font-size:0.7rem;" onclick="clearDue(${d.id})">Clear</button>
            </div>
          `).join('')}
          ${req.active_dues.length > 1 ? `
            <button class="btn btn-sm btn-secondary" style="font-size:0.72rem; margin-top:0.2rem;" onclick="clearAllDues('${req.student_pin}')">
              Clear All Dues
            </button>
          ` : ''}
        </div>
      `;
    }

    // Actions
    let actionButtons = '';
    if (req.clearance_status === 'Approved') {
      actionButtons = `
        <span style="font-size:0.78rem; color:var(--status-approved); font-weight:600;">
          ✓ Completed (${req.approved_by || 'Faculty'})
        </span>
      `;
    } else {
      const hasActiveDues = req.active_dues && req.active_dues.length > 0;
      actionButtons = `
        <div style="display:flex; gap:0.4rem;">
          <button class="btn btn-sm btn-success" ${hasActiveDues ? 'disabled title="Clear all dues before marking completed"' : ''} onclick="approveStudent('${escapeHtml(req.student_pin)}')">
            ✓ Mark Completed
          </button>
          <button class="btn btn-sm btn-danger" onclick="openAddDueModal('${escapeHtml(req.student_pin)}', '${escapeHtml(req.student_name).replace(/'/g, "\\'")}')">
            + Due
          </button>
        </div>
      `;
    }


    const subDate = req.submitted_at ? new Date(req.submitted_at).toLocaleDateString() : '-';

    tr.innerHTML = `
      <td style="font-family:var(--font-mono); font-weight:600; color:var(--accent-gold);">${req.student_pin}</td>
      <td><strong>${req.student_name}</strong></td>
      <td style="color:var(--text-secondary);">${req.admission_no}</td>
      <td style="color:var(--text-secondary);">${req.course_branch}</td>
      <td style="font-size:0.82rem; color:var(--text-muted);">${subDate}</td>
      <td>${statusBadge}</td>
      <td style="max-width:260px;">${duesContent}</td>
      <td>${actionButtons}</td>
    `;

    tbody.appendChild(tr);
  });
}

function filterRequests() {
  const query = document.getElementById('filter-search').value.toLowerCase().trim();
  if (!query) {
    renderRequestsTable(currentRequests);
    return;
  }

  const filtered = currentRequests.filter(r => 
    r.student_pin.toLowerCase().includes(query) ||
    r.student_name.toLowerCase().includes(query) ||
    r.admission_no.toLowerCase().includes(query)
  );
  renderRequestsTable(filtered);
}

// Add Due Modal
function openAddDueModal(pin, name) {
  activeDueStudentPin = pin;
  document.getElementById('modal-due-student-name').innerText = name;
  document.getElementById('modal-due-student-pin').innerText = pin;
  document.getElementById('due-reason').value = '';
  document.getElementById('add-due-modal').style.display = 'flex';
}

function closeAddDueModal() {
  document.getElementById('add-due-modal').style.display = 'none';
  activeDueStudentPin = null;
}

async function submitAddDue(e) {
  e.preventDefault();
  if (!activeDueStudentPin) return;

  const reason = document.getElementById('due-reason').value.trim();
  if (!reason) return;

  const btn = document.getElementById('btn-save-due');
  btn.disabled = true;

  const res = await API.request('/faculty/dues/add', {
    method: 'POST',
    body: {
      student_pin: activeDueStudentPin,
      reason
    }
  });

  btn.disabled = false;

  if (res.ok && res.data.success) {
    API.showToast('Due recorded successfully.', 'success');
    closeAddDueModal();
    loadFacultyDashboard();
  } else {
    API.showToast(res.data.error || 'Failed to add due.', 'error');
  }
}

async function clearDue(dueId) {
  const res = await API.request(`/faculty/dues/${dueId}`, {
    method: 'DELETE'
  });

  if (res.ok && res.data.success) {
    API.showToast('Due cleared. Request is re-checkable for approval.', 'success');
    loadFacultyDashboard();
  } else {
    API.showToast(res.data.error || 'Failed to clear due.', 'error');
  }
}

async function clearAllDues(pin) {
  if (!confirm(`Are you sure you want to clear all dues for student PIN ${pin}?`)) return;

  const res = await API.request('/faculty/dues/clear-all', {
    method: 'POST',
    body: { student_pin: pin }
  });

  if (res.ok && res.data.success) {
    API.showToast(res.data.message, 'success');
    loadFacultyDashboard();
  } else {
    API.showToast(res.data.error || 'Failed to clear all dues.', 'error');
  }
}

async function approveStudent(pin) {
  const res = await API.request('/faculty/approve', {
    method: 'POST',
    body: { student_pin: pin }
  });

  if (res.ok && res.data.success) {
    API.showToast(`Department clearance granted for student ${pin}.`, 'success');
    loadFacultyDashboard();
  } else {
    API.showToast(res.data.error || 'Failed to approve clearance.', 'error');
  }
}

// ---------------------------------------------------------------------------
// Dues Management & Student Search
// ---------------------------------------------------------------------------

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

function switchFacultyTab(tabName) {
  const btnQueue = document.getElementById('tab-queue');
  const btnDues = document.getElementById('tab-dues');
  const paneQueue = document.getElementById('pane-queue');
  const paneDues = document.getElementById('pane-dues');

  if (tabName === 'queue') {
    btnQueue.classList.add('active');
    btnDues.classList.remove('active');
    paneQueue.style.display = 'block';
    paneDues.style.display = 'none';
  } else {
    btnDues.classList.add('active');
    btnQueue.classList.remove('active');
    paneQueue.style.display = 'none';
    paneDues.style.display = 'block';
    loadDepartmentDues();
  }
}

let searchTimer = null;
let selectedDueStudent = null;

function handleStudentSearch(query) {
  clearTimeout(searchTimer);
  const trimmed = (query || '').trim();
  const resultsContainer = document.getElementById('due-search-results');

  if (trimmed.length < 1) {
    resultsContainer.style.display = 'none';
    resultsContainer.innerHTML = '';
    return;
  }

  searchTimer = setTimeout(async () => {
    resultsContainer.style.display = 'block';
    resultsContainer.innerHTML = '<div style="padding:0.6rem; color:var(--text-muted); font-size:0.85rem;">Searching student master database...</div>';

    const res = await API.request(`/faculty/students?search=${encodeURIComponent(trimmed)}`);
    if (res.ok && res.data.success && res.data.students.length > 0) {
      resultsContainer.innerHTML = res.data.students.map(s => `
        <div style="display:flex; justify-content:space-between; align-items:center; padding:0.6rem 0.8rem; border-bottom:1px solid var(--border-color); font-size:0.85rem;">
          <div>
            <strong style="color:var(--text-primary);">${escapeHtml(s.student_name)}</strong>
            <span style="color:var(--accent-gold); font-family:var(--font-mono); margin-left:0.4rem; font-weight:bold;">(${escapeHtml(s.pin)})</span>
            <div style="font-size:0.78rem; color:var(--text-secondary); margin-top:0.2rem;">
              ${escapeHtml(s.course_branch || '')} • Adm: ${escapeHtml(s.admission_no || '')}
            </div>
          </div>
          <button type="button" class="btn btn-sm btn-primary" onclick="selectDueStudent('${escapeHtml(s.pin)}', '${escapeHtml(s.student_name).replace(/'/g, "\\'")}', '${escapeHtml(s.admission_no)}', '${escapeHtml(s.course_branch).replace(/'/g, "\\'")}')">
            Select
          </button>
        </div>
      `).join('');
    } else {
      resultsContainer.innerHTML = '<div style="padding:0.6rem; color:var(--text-muted); font-size:0.85rem;">No student found matching query. Try typing another PIN or Name.</div>';
    }
  }, 200);
}

function selectDueStudent(pin, name, adm, branch) {
  selectedDueStudent = { pin, name, adm, branch };
  document.getElementById('sel-student-name').innerText = name;
  document.getElementById('sel-student-pin').innerText = pin;
  document.getElementById('sel-student-adm').innerText = adm || '—';
  document.getElementById('sel-student-branch').innerText = branch || '—';

  document.getElementById('selected-student-container').style.display = 'block';
  document.getElementById('due-search-results').style.display = 'none';
  document.getElementById('due-student-search').value = `${name} (${pin})`;
  document.getElementById('create-due-reason').focus();
}

function clearSelectedDueStudent() {
  selectedDueStudent = null;
  document.getElementById('selected-student-container').style.display = 'none';
  document.getElementById('due-student-search').value = '';
  document.getElementById('due-student-search').focus();
  document.getElementById('due-search-results').style.display = 'none';
}

async function submitCreateDue(e) {
  e.preventDefault();
  if (!selectedDueStudent || !selectedDueStudent.pin) {
    API.showToast('Please search and select a student first.', 'warning');
    return;
  }

  const amount = document.getElementById('create-due-amount').value.trim();
  const reason = document.getElementById('create-due-reason').value.trim();

  if (!reason) {
    API.showToast('Please enter the reason for the due.', 'warning');
    return;
  }

  const btn = document.getElementById('btn-submit-create-due');
  btn.disabled = true;
  btn.innerText = 'Recording Due...';

  const res = await API.request('/faculty/dues', {
    method: 'POST',
    body: {
      student_pin: selectedDueStudent.pin,
      reason: reason,
      amount: amount || '0'
    }
  });

  btn.disabled = false;
  btn.innerText = '➕ Issue Official Department Due';

  if (res.ok && res.data.success) {
    API.showToast(res.data.message, 'success');
    clearSelectedDueStudent();
    document.getElementById('create-due-reason').value = '';
    document.getElementById('create-due-amount').value = '0';
    loadDepartmentDues();
    loadFacultyDashboard();
  } else {
    API.showToast(res.data.error || 'Failed to record due.', 'error');
  }
}

async function loadDepartmentDues() {
  const tbody = document.getElementById('dues-ledger-table-body');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; color:var(--text-muted); padding:1.5rem;">Loading departmental dues records...</td></tr>';

  const res = await API.request('/faculty/dues');
  if (!res.ok || !res.data.success) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; color:var(--status-due); padding:1.5rem;">Failed to load dues ledger.</td></tr>';
    return;
  }

  const dues = res.data.dues || [];
  const tabBadgeDues = document.getElementById('tab-badge-dues');
  const activeCount = dues.filter(d => d.status === 'Active').length;
  if (tabBadgeDues) tabBadgeDues.innerText = activeCount;

  if (dues.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; color:var(--text-muted); padding:2rem;">No dues recorded in this department yet. Use the search form above to issue a due.</td></tr>';
    return;
  }

  tbody.innerHTML = dues.map(d => {
    const isActive = d.status === 'Active';
    const statusBadge = isActive ? '<span class="badge badge-due">Active Due</span>' : '<span class="badge badge-approved">Cleared</span>';
    const amtDisplay = (d.amount && d.amount !== '0') ? `₹${d.amount}` : '<span style="color:var(--text-muted);">Non-Monetary</span>';

    return `
      <tr>
        <td style="font-family:var(--font-mono); font-weight:700; color:var(--accent-gold);">${escapeHtml(d.student_pin)}</td>
        <td><strong>${escapeHtml(d.student_name || '—')}</strong></td>
        <td style="font-size:0.82rem;">${escapeHtml(d.course_branch || '—')}</td>
        <td>${escapeHtml(d.reason)}</td>
        <td><strong>${amtDisplay}</strong></td>
        <td>${statusBadge}</td>
        <td style="font-size:0.8rem; color:var(--text-secondary);">${d.created_at ? d.created_at.slice(0, 10) : '—'}</td>
        <td>
          ${isActive ? `
            <button class="btn btn-sm btn-primary" onclick="markDueCleared(${d.id}, '${escapeHtml(d.student_pin)}')">
              ✓ Mark Cleared
            </button>
          ` : '<span style="color:var(--text-muted); font-size:0.8rem;">Cleared</span>'}
        </td>
      </tr>
    `;
  }).join('');
}

async function markDueCleared(dueId, pin) {
  const pinDisplay = pin || `#${dueId}`;
  if (!confirm(`Confirm mark due #${dueId} as cleared for student PIN ${pinDisplay}?`)) return;

  const res = await API.request(`/faculty/dues/${dueId}/clear`, {
    method: 'POST'
  });

  if (res.ok && res.data.success) {
    API.showToast(`Due #${dueId} cleared successfully for student ${pinDisplay}.`, 'success');
    loadDepartmentDues();
    loadFacultyDashboard();
  } else {
    API.showToast(res.data.error || 'Failed to clear due.', 'error');
  }
}

function exportFacultyQueueCSV() {
  if (!cachedStudents || cachedStudents.length === 0) {
    API.showToast('No clearance requests available to export.', 'info');
    return;
  }
  const headers = [
    { key: 'student_pin', label: 'Student PIN' },
    { key: 'student_name', label: 'Student Name' },
    { key: 'admission_no', label: 'Admission No' },
    { key: 'course_branch', label: 'Branch' },
    { key: 'submitted_at', label: 'Submission Date' },
    { key: 'clearance_status', label: 'Status' }
  ];
  API.exportToCSV('SVGP_Faculty_Clearance_Queue.csv', cachedStudents, headers);
}

// Window global bindings for all HTML onclick handlers
window.approveStudent = approveStudent;
window.clearDue = clearDue;
window.clearAllDues = clearAllDues;
window.markDueCleared = markDueCleared;
window.openAddDueModal = openAddDueModal;
window.closeAddDueModal = closeAddDueModal;
window.submitAddDue = submitAddDue;
window.filterRequests = filterRequests;
window.filterDues = filterDues;
window.openCreateDueModal = openCreateDueModal;
window.closeCreateDueModal = closeCreateDueModal;
window.submitCreateDue = submitCreateDue;
window.searchStudentForDue = searchStudentForDue;
window.selectStudentForDue = selectStudentForDue;
window.exportFacultyQueueCSV = exportFacultyQueueCSV;


