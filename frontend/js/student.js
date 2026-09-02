// Student Portal JavaScript

document.addEventListener('DOMContentLoaded', () => {
  initCollegeBranding();
  loadDepartmentsDropdown();
  checkAuthAndInit();
  setupFormListeners();
});

function initCollegeBranding() {
  if (window.APP_CONFIG && window.APP_CONFIG.COLLEGE) {
    const titleEl = document.getElementById('college-name-display');
    const crestEl = document.getElementById('college-crest-img');
    if (titleEl) titleEl.innerText = window.APP_CONFIG.COLLEGE.NAME;
    if (crestEl) crestEl.src = window.APP_CONFIG.COLLEGE.LOGO_PATH;
  }
}

async function loadDepartmentsDropdown() {
  const select = document.getElementById('reg-dept');
  if (!select) return;

  const branchRes = await API.request('/branches');
  if (branchRes.ok && branchRes.data.branches && branchRes.data.branches.length > 0) {
    select.innerHTML = '<option value="">-- Select Branch / Course --</option>';
    branchRes.data.branches.forEach(b => {
      const opt = document.createElement('option');
      opt.value = b.name;
      opt.textContent = `${b.name} (${b.code})`;
      select.appendChild(opt);
    });
    return;
  }

  // Fallback to departments if branches are not returned
  const res = await API.request('/departments');
  if (res.ok && res.data.departments) {
    select.innerHTML = '<option value="">-- Select Department / Course --</option>';
    res.data.departments.forEach(d => {
      const opt = document.createElement('option');
      opt.value = d.name;
      opt.textContent = `${d.name} (${d.type})`;
      select.appendChild(opt);
    });
  }
}

function checkAuthAndInit() {
  const user = API.getUser();
  const token = API.getToken();

  if (token && user && user.role === 'student') {
    showDashboard(user);
  } else {
    showAuth();
  }
}

function showAuth() {
  document.getElementById('auth-section').style.display = 'block';
  document.getElementById('dashboard-section').style.display = 'none';
  document.getElementById('student-logged-in-badge').style.display = 'none';
}

function showDashboard(user) {
  document.getElementById('auth-section').style.display = 'none';
  document.getElementById('dashboard-section').style.display = 'block';
  
  const badge = document.getElementById('student-logged-in-badge');
  badge.style.display = 'flex';
  document.getElementById('student-badge-name').innerText = user.student_name || 'Student';
  document.getElementById('student-badge-pin').innerText = user.pin || '';

  loadDashboard();
}

function switchAuthTab(tab) {
  const loginForm = document.getElementById('student-login-form');
  const regForm = document.getElementById('student-register-form');
  const tabLogin = document.getElementById('tab-login');
  const tabReg = document.getElementById('tab-register');

  if (tab === 'login') {
    loginForm.style.display = 'block';
    regForm.style.display = 'none';
    tabLogin.classList.add('active');
    tabReg.classList.remove('active');
  } else {
    loginForm.style.display = 'none';
    regForm.style.display = 'block';
    tabLogin.classList.remove('active');
    tabReg.classList.add('active');
  }
}

function setupFormListeners() {
  // Login
  const loginForm = document.getElementById('student-login-form');
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const pin = document.getElementById('login-pin').value.trim();
    const name = document.getElementById('login-name').value.trim();

    const btn = document.getElementById('btn-login-submit');
    btn.disabled = true;
    btn.innerText = 'Logging in...';

    const res = await API.request('/auth/student/login', {
      method: 'POST',
      body: { pin, name }
    });

    btn.disabled = false;
    btn.innerText = 'Login to Portal';

    if (res.ok && res.data.success) {
      API.setAuth(res.data.token, { ...res.data.student, role: 'student' });
      API.showToast('Login successful!', 'success');
      showDashboard(res.data.student);
    } else {
      API.showToast(res.data.error || 'Login failed.', 'error');
    }
  });

  // Registration
  const regForm = document.getElementById('student-register-form');
  regForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const pin = document.getElementById('reg-pin').value.trim();
    const name = document.getElementById('reg-name').value.trim();
    const department = document.getElementById('reg-dept').value.trim();

    const btn = document.getElementById('btn-register-submit');
    btn.disabled = true;
    btn.innerText = 'Verifying & Registering...';

    const res = await API.request('/auth/student/register', {
      method: 'POST',
      body: { pin, name, department }
    });

    btn.disabled = false;
    btn.innerText = 'Register Account';

    if (res.ok && res.data.success) {
      API.setAuth(res.data.token, { ...res.data.student, role: 'student' });
      API.showToast('Registration successful! Welcome.', 'success');
      showDashboard(res.data.student);
    } else {
      API.showToast(res.data.error || 'Registration failed.', 'error');
    }
  });
}

async function loadDashboard() {
  const deptGrid = document.getElementById('department-grid');
  if (deptGrid && deptGrid.children.length === 0) {
    API.renderSkeletonCards(deptGrid, 4);
  }

  const res = await API.request('/students/dashboard');
  if (!res.ok) {
    API.showToast(res.data.error || 'Failed to load clearance records.', 'error');
    return;
  }

  const data = res.data;
  renderProfile(data.student);

  const promptCard = document.getElementById('no-dues-prompt-card');
  const trackerSection = document.getElementById('tracker-section');
  const certSection = document.getElementById('certificate-section');
  const statusBadge = document.getElementById('overall-status-badge');

  const progressCard = document.getElementById('clearance-progress-card');
  const progressBar = document.getElementById('progress-meter-fill');
  const progressBadge = document.getElementById('progress-summary-badge');
  const step3Item = document.getElementById('step-3-item');
  const step3Status = document.getElementById('step-3-status');
  const step4Item = document.getElementById('step-4-item');
  const step4Status = document.getElementById('step-4-status');

  if (!data.request) {
    // No request submitted yet
    if (progressCard) progressCard.style.display = 'none';
    promptCard.style.display = 'block';
    trackerSection.style.display = 'none';
    certSection.style.display = 'none';
    statusBadge.className = 'badge badge-pending';
    statusBadge.innerText = 'Not Submitted';
  } else {
    promptCard.style.display = 'none';
    trackerSection.style.display = 'block';
    if (progressCard) progressCard.style.display = 'block';

    const totalDepts = data.clearances ? data.clearances.length : 0;
    const approvedDepts = data.clearances ? data.clearances.filter(c => c.status === 'Approved').length : 0;
    const dueDepts = data.clearances ? data.clearances.filter(c => c.status === 'Due Found').length : 0;
    const percentage = totalDepts > 0 ? Math.round((approvedDepts / totalDepts) * 100) : 0;

    if (progressBar) progressBar.style.width = `${percentage}%`;
    if (progressBadge) {
      progressBadge.innerText = `${approvedDepts} / ${totalDepts} Cleared (${percentage}%)`;
      progressBadge.className = data.is_no_dues_completed ? 'badge badge-approved' : (dueDepts > 0 ? 'badge badge-due' : 'badge badge-pending');
    }

    if (data.is_no_dues_completed) {
      statusBadge.className = 'badge badge-approved';
      statusBadge.innerText = 'No-Dues Completed';
      certSection.style.display = 'block';
      if (step3Item) {
        step3Item.className = 'step-item step-completed';
        if (step3Status) step3Status.innerHTML = '<span style="color:var(--status-approved);">✓ All Cleared</span>';
      }
      if (step4Item) {
        step4Item.className = 'step-item step-active';
        if (step4Status) step4Status.innerHTML = '<span style="color:var(--accent-gold);">Ready for Issue</span>';
      }
      renderCertificateDetails(data.certificate, data.student);
    } else {
      statusBadge.className = 'badge badge-pending';
      statusBadge.innerText = 'In Progress';
      certSection.style.display = 'none';
      if (step3Item) {
        step3Item.className = 'step-item step-active';
        if (step3Status) step3Status.innerText = `${approvedDepts}/${totalDepts} Approved`;
      }
      if (step4Item) {
        step4Item.className = 'step-item';
        if (step4Status) step4Status.innerText = 'Pending Approvals';
      }
    }

    renderClearances(data.clearances);
  }

}

function deriveTNo(pin) {
  if (!pin) return '';
  const last3 = pin.trim().slice(-3);
  return last3.replace(/^0+/, '') || '0';
}

function renderProfile(student) {
  if (!student) return;
  document.getElementById('dash-student-name').innerText = student.student_name || '—';
  document.getElementById('dash-student-pin').innerText = student.pin || '—';
  document.getElementById('dash-admission-no').innerText = student.admission_no || '—';
  document.getElementById('dash-course-branch').innerText = student.course_branch || '—';
  
  const fatherEl = document.getElementById('dash-father-name');
  if (fatherEl) fatherEl.innerText = student.father_name || '—';

  const dobEl = document.getElementById('dash-dob');
  if (dobEl) dobEl.innerText = student.dob || '—';

  const natRelEl = document.getElementById('dash-nat-rel');
  if (natRelEl) natRelEl.innerText = `${student.nationality || 'Indian'} / ${student.religion || 'Hindu'}`;

  document.getElementById('dash-doa').innerText = student.date_of_admission || '—';
  document.getElementById('dash-t-no').innerText = deriveTNo(student.pin);
}

function renderClearances(clearances) {
  const container = document.getElementById('department-grid');
  container.innerHTML = '';

  if (!clearances || clearances.length === 0) {
    API.renderEmptyState(container, 'No Department Clearances', 'No department clearances are currently assigned.', '📋');
    return;
  }

  clearances.forEach(item => {
    const card = document.createElement('div');
    let statusClass = 'status-pending';
    let badgeClass = 'badge-pending';
    let statusText = 'Pending';

    if (item.status === 'Approved') {
      statusClass = 'status-approved';
      badgeClass = 'badge-approved';
      statusText = 'Approved';
    } else if (item.status === 'Due Found') {
      statusClass = 'status-due';
      badgeClass = 'badge-due';
      statusText = 'Due Found';
    }

    card.className = `clearance-card ${statusClass}`;

    let dueHtml = '';
    if (item.active_dues && item.active_dues.length > 0) {

      dueHtml = `
        <div class="due-alert-box">
          ${item.active_dues.map(d => `
            <div class="due-reason">⚠️ Due: ${d.reason}</div>
            <div class="due-contact-instruction">
              📍 ${d.contact_instruction}
            </div>
          `).join('')}
        </div>
      `;
    }

    let metaText = `${item.department_type} Department`;
    const isNcc = item.department_name && (item.department_name.toUpperCase().includes('NSS') || item.department_name.toUpperCase().includes('NCC'));
    if (isNcc && item.department_type === 'Physical') {
      metaText = '🏛️ Non-Cadet (Clerk Verification)';
    } else if (isNcc) {
      metaText = '🎖️ Enrolled Cadet (Faculty Incharge)';
    }

    let reNotifyHtml = '';
    if (item.department_type === 'Online' && item.status !== 'Approved') {
      if (item.can_re_notify) {
        reNotifyHtml = `
          <button class="btn btn-sm btn-secondary btn-block" style="margin-top:0.75rem;" onclick="reNotify(${item.department_id})">
            🔔 Re-notify Incharge
          </button>
        `;
      } else {
        reNotifyHtml = `
          <button class="btn btn-sm btn-secondary btn-block" style="margin-top:0.75rem;" disabled title="Allowed once every 20 hours">
            ⏳ Re-notify available in ${item.remaining_hours_to_re_notify}h
          </button>
        `;
      }
    } else if (item.department_type === 'Physical' && item.status !== 'Approved') {
      reNotifyHtml = `
        <div style="font-size:0.75rem; color:var(--text-muted); margin-top:0.6rem;">
          ℹ️ ${isNcc ? 'Non-cadet clearance will be verified by the Clerk.' : 'Physical clearance will be recorded by Clerk.'}
        </div>
      `;
    }

    card.innerHTML = `
      <div>
        <div class="clearance-header">
          <div>
            <div class="dept-name">${item.department_name}</div>
            <div class="dept-meta">${metaText}</div>
          </div>
          <span class="badge ${badgeClass}">${statusText}</span>
        </div>
        ${dueHtml}
      </div>
      <div>
        ${item.approved_by ? `<div style="font-size:0.75rem; color:var(--text-muted); margin-top:0.5rem;">Approved by: ${item.approved_by}</div>` : ''}
        ${reNotifyHtml}
      </div>
    `;

    container.appendChild(card);
  });
}

async function submitNoDues() {
  const btn = document.getElementById('btn-submit-nodues');
  btn.disabled = true;
  btn.innerText = 'Submitting Request...';

  const nccYes = document.getElementById('ncc-opt-yes');
  const is_ncc_cadet = nccYes ? nccYes.checked : false;

  const res = await API.request('/students/no-dues/submit', {
    method: 'POST',
    body: { is_ncc_cadet }
  });

  btn.disabled = false;
  btn.innerText = '🚀 Submit No-Dues Clearance Request';

  if (res.ok && res.data.success) {
    API.showToast('No-Dues clearance request submitted successfully!', 'success');
    loadDashboard();
  } else {
    API.showToast(res.data.error || 'Failed to submit request.', 'error');
  }
}


async function reNotify(deptId) {
  const res = await API.request('/students/no-dues/re-notify', {
    method: 'POST',
    body: { departmentId: deptId }
  });

  if (res.ok && res.data.success) {
    API.showToast(res.data.message, 'success');
    loadDashboard();
  } else {
    API.showToast(res.data.error || 'Failed to send re-notification.', 'error');
  }
}

function renderCertificateDetails(cert, student) {
  const container = document.getElementById('cert-details-container');
  const btnContainer = document.getElementById('cert-view-btn-container');

  if (!cert) {
    container.innerHTML = '<p style="color:var(--text-muted); padding:1rem; text-align:center;">No-Dues cleared. Awaiting Clerk verification and locking.</p>';
    btnContainer.innerHTML = '';
    return;
  }

  const d = cert.details || {};
  const isGenerated = cert.status === 'Generated';
  const pin = (student && student.pin) || d.student_pin || '';
  const t_no = d.t_no || deriveTNo(pin);

  // Status badge styling
  let badgeClass = 'badge-pending';
  if (isGenerated) badgeClass = 'badge-approved';
  else if (cert.status === 'Verified & Locked') badgeClass = 'badge-info';

  container.innerHTML = `
    <!-- Top Summary Banner -->
    <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1rem; padding-bottom:1rem; margin-bottom:1.2rem; border-bottom:1px solid var(--border-color);">
      <div>
        <div style="font-size:0.75rem; text-transform:uppercase; letter-spacing:0.06em; color:var(--text-muted); font-weight:700;">Certificate Document Status</div>
        <div style="display:flex; align-items:center; gap:0.6rem; margin-top:0.3rem;">
          <span class="badge ${badgeClass}" style="font-size:0.88rem; padding:0.35rem 0.8rem;">${cert.status}</span>
          ${isGenerated ? `<span class="badge badge-info" style="font-size:0.82rem;">Version v${cert.version} (${d.generated_date || 'Current'})</span>` : ''}
          <span style="font-size:0.88rem; font-weight:700; color:var(--accent-gold); font-family:var(--font-mono);">TC No: ${t_no}</span>
        </div>
      </div>
      <div style="text-align:right; font-size:0.82rem; color:var(--text-muted);">
        <div>Authority: <strong style="color:var(--text-primary);">${d.generated_by || d.verified_by || 'Clerk Administration'}</strong></div>
        <div>Record Security: <strong style="color:var(--status-approved);">100% Cleared &amp; Locked</strong></div>
      </div>
    </div>

    <!-- Section 1: Official Transfer & Academic Leaving Specifics -->
    <div style="margin-bottom:1.2rem;">
      <div style="font-size:0.85rem; font-weight:700; text-transform:uppercase; letter-spacing:0.05em; color:var(--accent-gold); margin-bottom:0.6rem; display:flex; align-items:center; gap:0.4rem;">
        📜 1. Official Transfer &amp; Academic Clearance Specifics (Read-Only)
      </div>
      <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 0.8rem; font-size: 0.88rem; background:var(--bg-subtle); padding:1rem; border-radius:var(--radius-sm); border:1px solid var(--border-color);">
        <div><strong style="color:var(--text-secondary);">Transfer Certificate No (T. No):</strong><br><span style="font-weight:700; color:var(--accent-gold);">${t_no}</span></div>
        <div><strong style="color:var(--text-secondary);">Date of Leaving College:</strong><br><span style="font-weight:600;">${d.date_of_leaving || 'Under Clerk Verification'}</span></div>
        <div><strong style="color:var(--text-secondary);">College Fees &amp; Dues Paid:</strong><br><span style="font-weight:600; color:${(d.fees_paid === 'Yes' || d.fees_paid === 'YES') ? 'var(--status-approved)' : 'var(--text-primary)'};">${d.fees_paid || 'Yes'}</span></div>
        <div><strong style="color:var(--text-secondary);">Promotion / Qualifying Status:</strong><br><span style="font-weight:600;">${d.promotion_status || 'Under Clerk Verification'}</span></div>
        <div><strong style="color:var(--text-secondary);">Conduct &amp; Character:</strong><br><span style="font-weight:600; color:var(--status-approved);">${d.conduct_character || 'Good'}</span></div>
        <div><strong style="color:var(--text-secondary);">Verified / Locked By:</strong><br><span style="font-weight:600;">${d.verified_by || d.generated_by || 'Clerk Admin'}</span></div>
      </div>
    </div>

    <!-- Section 2: Complete Student Identity & Master Record -->
    <div>
      <div style="font-size:0.85rem; font-weight:700; text-transform:uppercase; letter-spacing:0.05em; color:var(--accent-gold); margin-bottom:0.6rem; display:flex; align-items:center; gap:0.4rem;">
        🎓 2. Certified Student Master Identity (Read-Only)
      </div>
      <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 0.8rem; font-size: 0.88rem; background:var(--bg-subtle); padding:1rem; border-radius:var(--radius-sm); border:1px solid var(--border-color);">
        <div><strong style="color:var(--text-secondary);">Student Full Name:</strong><br><span style="font-weight:700;">${d.student_name || (student && student.student_name) || '—'}</span></div>
        <div><strong style="color:var(--text-secondary);">Permanent PIN:</strong><br><span style="font-family:var(--font-mono); font-weight:700; color:var(--accent-gold);">${pin || '—'}</span></div>
        <div><strong style="color:var(--text-secondary);">Admission Number:</strong><br><span style="font-weight:600;">${d.admission_no || (student && student.admission_no) || '—'}</span></div>
        <div><strong style="color:var(--text-secondary);">Course / Branch:</strong><br><span style="font-weight:600;">${d.course_branch || (student && student.course_branch) || '—'}</span></div>
        <div><strong style="color:var(--text-secondary);">Father's / Guardian's Name:</strong><br><span style="font-weight:600;">${d.father_name || (student && student.father_name) || '—'}</span></div>
        <div><strong style="color:var(--text-secondary);">Date of Birth (DOB):</strong><br><span style="font-weight:600;">${d.dob || (student && student.dob) || '—'}</span></div>
        <div><strong style="color:var(--text-secondary);">Nationality:</strong><br><span style="font-weight:600;">${d.nationality || (student && student.nationality) || 'Indian'}</span></div>
        <div><strong style="color:var(--text-secondary);">Religion:</strong><br><span style="font-weight:600;">${d.religion || (student && student.religion) || 'Hindu'}</span></div>
        <div><strong style="color:var(--text-secondary);">Date of Admission:</strong><br><span style="font-weight:600;">${d.date_of_admission || (student && student.date_of_admission) || '—'}</span></div>
      </div>
    </div>
  `;

  if (isGenerated) {
    btnContainer.innerHTML = `
      <span class="badge badge-approved" style="font-size:0.85rem; padding:0.4rem 0.8rem;">
        ✅ Official Certificate Verified by Clerk
      </span>
    `;
  } else {
    btnContainer.innerHTML = `
      <span class="badge badge-info" style="font-size:0.85rem; padding:0.4rem 0.8rem;">
        ⏳ Awaiting Clerk Verification &amp; Generation
      </span>
    `;
  }
}

// Window global bindings for student onclick handlers
window.submitNoDues = submitNoDues;
window.reNotify = reNotify;
window.switchTab = switchTab;


