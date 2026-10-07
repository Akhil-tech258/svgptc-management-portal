// Certificate Rendering and Print Logic

document.addEventListener('DOMContentLoaded', () => {
  initBranding();
  loadCertificate();
});

function initBranding() {
  if (window.APP_CONFIG && window.APP_CONFIG.COLLEGE) {
    const col = window.APP_CONFIG.COLLEGE;
    
    const elName1 = document.getElementById('cert-college-name');
    if (elName1) elName1.innerText = col.NAME || 'S.V. GOVERNMENT POLYTECHNIC :: TIRUPATI';

    const elSub1 = document.getElementById('cert-college-sub');
    if (elSub1) elSub1.innerText = col.SUBTITLE || '';

    const elCode1 = document.getElementById('cert-college-code');
    if (elCode1) elCode1.innerText = `INST CODE: ${col.INSTITUTION_CODE} | ${col.AFFILIATION}`;

    const elCrest1 = document.getElementById('cert-crest-img');
    if (elCrest1 && col.LOGO_PATH) elCrest1.src = col.LOGO_PATH;

    const elName2 = document.getElementById('cert-college-name-2');
    if (elName2) elName2.innerText = col.NAME || 'S.V. GOVERNMENT POLYTECHNIC :: TIRUPATI';

    const elSub2 = document.getElementById('cert-college-sub-2');
    if (elSub2) elSub2.innerText = col.SUBTITLE || '';

    const elCode2 = document.getElementById('cert-college-code-2');
    if (elCode2) elCode2.innerText = `INST CODE: ${col.INSTITUTION_CODE}`;

    const elCrest2 = document.getElementById('cert-crest-img-2');
    if (elCrest2 && col.LOGO_PATH) elCrest2.src = col.LOGO_PATH;

    const elName3 = document.getElementById('cert-college-name-3');
    if (elName3) elName3.innerText = col.NAME || 'S.V. GOVERNMENT POLYTECHNIC :: TIRUPATI';

    const elCrest3 = document.getElementById('cert-crest-img-3');
    if (elCrest3 && col.LOGO_PATH) elCrest3.src = col.LOGO_PATH;

    // Optional Watermark branding if defined in config
    const watermarkPath = col.WATERMARK_PATH || col.LOGO_PATH;
    if (watermarkPath) {
      const tcWm = document.getElementById('tc-watermark');
      if (tcWm) tcWm.src = watermarkPath;
      const scWm = document.getElementById('sc-watermark');
      if (scWm) scWm.src = watermarkPath;
      const ndWm = document.getElementById('nd-watermark');
      if (ndWm) ndWm.src = watermarkPath;
    }
  }
}

async function loadCertificate() {
  const user = API.getUser();
  const params = new URLSearchParams(window.location.search);
  const pin = params.get('pin');
  const version = params.get('version');

  if (!user) {
    document.body.innerHTML = `
      <div style="max-width:500px; margin:4rem auto; text-align:center; padding:2.5rem; background:var(--bg-card, #ffffff); border:1px solid var(--border-color, #cbd5e1); border-radius:12px; color:var(--text-primary, #0f172a); font-family:sans-serif;">
        <div style="font-size:2.8rem; margin-bottom:1rem;">🔐</div>
        <h2 style="margin-bottom:0.6rem;">Authentication Required</h2>
        <p style="color:var(--text-secondary, #475569); font-size:0.9rem; line-height:1.5; margin-bottom:1.5rem;">
          Please sign in to view official college certificates.
        </p>
        <a href="index.html" style="display:inline-block; padding:0.6rem 1.4rem; background:#1d4ed8; color:#fff; text-decoration:none; border-radius:6px; font-weight:600;">Go to Portal Home &rarr;</a>
      </div>
    `;
    return;
  }

  // Allow Clerk or the specific student viewing their own certificate
  const isAuthorized = user.role === 'clerk' || (user.role === 'student' && pin && user.pin.toLowerCase() === pin.toLowerCase());
  if (!isAuthorized) {
    document.body.innerHTML = `
      <div style="max-width:500px; margin:4rem auto; text-align:center; padding:2.5rem; background:var(--bg-card, #ffffff); border:1px solid var(--border-color, #cbd5e1); border-radius:12px; color:var(--text-primary, #0f172a); font-family:sans-serif;">
        <div style="font-size:2.8rem; margin-bottom:1rem;">🏛️</div>
        <h2 style="margin-bottom:0.6rem;">Access Restricted</h2>
        <p style="color:var(--text-secondary, #475569); font-size:0.9rem; line-height:1.5; margin-bottom:1.5rem;">
          You can only view your own verified institutional certificate.
        </p>
        <a href="student.html" style="display:inline-block; padding:0.6rem 1.4rem; background:#1d4ed8; color:#fff; text-decoration:none; border-radius:6px; font-weight:600;">Go to Student Portal &rarr;</a>
      </div>
    `;
    return;
  }



  if (!pin) {
    alert('No Student PIN provided in URL.');
    return;
  }

  // 1. Fetch No Dues Form Data (Generated only after ALL department clearances are 100% approved)
  try {
    const ndRes = await API.request(`/certificates/${encodeURIComponent(pin)}/nodues-form`);
    if (ndRes.ok && ndRes.data && ndRes.data.data) {
      populateNoDuesForm(ndRes.data.data);
    } else {
      const ndDoc = document.getElementById('nodues-document');
      if (ndDoc) {
        const errorMsg = (ndRes.data && ndRes.data.error) ? ndRes.data.error : 'No Dues Certificate cannot be generated until ALL department clearances are approved.';
        ndDoc.innerHTML = `
          <div style="padding:2.5rem 1.5rem; text-align:center; background:#fff1f2; border:1px solid #fecdd3; border-radius:8px; color:#9f1239; font-family:sans-serif; margin:1rem auto; max-width:650px;">
            <div style="font-size:3rem; margin-bottom:0.8rem;">🔒</div>
            <h3 style="margin-bottom:0.6rem; color:#881337; font-size:1.25rem;">No Dues Certificate Generation Restricted</h3>
            <p style="font-size:0.95rem; line-height:1.6; color:#9f1239; margin-bottom:1.2rem;">${errorMsg}</p>
            <div style="font-size:0.85rem; background:#ffe4e6; padding:0.6rem 1rem; border-radius:6px; display:inline-block; font-weight:600;">
              ⚠️ Requires 100% Department Approvals from all Laboratories &amp; Administrative Units
            </div>
          </div>
        `;
      }
    }
  } catch (err) {
    console.warn('Failed to load No Dues Form data:', err);
  }

  // 2. Fetch TC & Conduct Certificate Details (Available after Clerk issuance)
  let endpoint = `/certificates/${encodeURIComponent(pin)}`;
  if (version) {
    endpoint += `/version/${encodeURIComponent(version)}`;
  }

  const res = await API.request(endpoint);
  if (res.ok && res.data && res.data.certificate) {
    populateTC(res.data.certificate);
    populateConduct(res.data.certificate);
  } else {
    const tcDoc = document.getElementById('tc-document');
    if (tcDoc) {
      const tcNotice = document.createElement('div');
      tcNotice.style.cssText = 'padding:1.5rem; text-align:center; color:#94a3b8; font-style:italic; background:#f8fafc; border:1px dashed #cbd5e1; margin-bottom:2rem; font-family:sans-serif;';
      tcNotice.innerHTML = '🎓 <strong>Transfer Certificate (TC) & Conduct Certificate:</strong> Pending issuance by Administrative Office (Clerk). Complete all department clearances first.';
      tcDoc.parentNode.insertBefore(tcNotice, tcDoc);
    }
  }
}

function populateNoDuesForm(nd) {
  if (!nd) return;

  const elDeptTitle = document.getElementById('nd-dept-title');
  if (elDeptTitle) elDeptTitle.innerText = nd.department_title || 'DEPARTMENT OF COMPUTER ENGINEERING';

  const elName = document.getElementById('nd-student-name');
  if (elName) elName.innerText = (nd.student_name || '--').toUpperCase();

  const elPin = document.getElementById('nd-pin-number');
  if (elPin) elPin.innerText = nd.student_pin || '--';

  const elPeriod = document.getElementById('nd-study-period');
  if (elPeriod) elPeriod.innerText = nd.study_period || '2023 - 2026';

  const elBranch = document.getElementById('nd-branch-name');
  if (elBranch) elBranch.innerText = (nd.branch_code || 'CME').toUpperCase();

  const listEl = document.getElementById('nd-clearance-list');
  if (listEl && Array.isArray(nd.clearances)) {
    listEl.innerHTML = '';
    nd.clearances.forEach((c, idx) => {
      const li = document.createElement('li');
      li.className = 'nd-clearance-item';

      const deptNameUpper = (c.name || `DEPARTMENT ${idx + 1}`).toUpperCase();

      // Per user prompt requirement: "with only marked as cleared"
      // Only items that are approved/cleared in system get marked as "NO DUES"!
      let statusHtml = '';
      if (c.is_cleared || c.status === 'Approved' || c.status === 'Cleared') {
        statusHtml = `<span class="nd-status-val cleared">: NO DUES</span>`;
      } else {
        // Uncleared / Pending items are NOT marked as cleared (left with blank line for physical signature)
        statusHtml = `<span class="nd-status-val pending">: _______________________</span>`;
      }

      li.innerHTML = `
        <span class="nd-dept-label">${deptNameUpper}</span>
        ${statusHtml}
      `;
      listEl.appendChild(li);
    });
  }
}

const digitWords = ['ZERO', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE'];
const monthNames = ['', 'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];

function dateToWords(dateStr) {
  if (!dateStr) return '';
  const parts = String(dateStr).trim().match(/^(\d{1,2})[-\/\.](\d{1,2})[-\/\.](\d{4})$/);
  if (!parts) return '';
  const d = String(parts[1]).padStart(2, '0');
  const m = parseInt(parts[2], 10);
  const y = String(parts[3]);

  const dWords = d.split('').map(digit => digitWords[parseInt(digit, 10)]).join(' ');
  const mWord = monthNames[m] || 'MONTH';
  const yWords = y.split('').map(digit => digitWords[parseInt(digit, 10)]).join(' ');

  return `(${dWords}-${mWord}-${yWords})`;
}

function formatClassStudied(course) {
  if (!course) return '--';
  const str = String(course).trim().toUpperCase();
  if (str.includes('FINAL') || str.includes('DCME') || str.includes('DECE') || str.includes('DEEE') || str.includes('DME') || str.includes('DCE')) {
    return str;
  }
  // Standard polytechnic abbreviations
  if (str.includes('COMPUTER')) return 'DCME FINAL YEAR';
  if (str.includes('ELECTRONICS AND COMM')) return 'DECE (II) FINAL YEAR';
  if (str.includes('ELECTRICAL')) return 'DEEE FINAL YEAR';
  if (str.includes('MECHANICAL')) return 'DME FINAL YEAR';
  if (str.includes('CIVIL')) return 'DCE FINAL YEAR';
  if (str.includes('PHARM')) return 'D.PHARMA FINAL YEAR';
  if (str.includes('AUTO')) return 'DAE FINAL YEAR';
  return `${str} FINAL YEAR`;
}

function populateTC(c) {
  const elAdm = document.getElementById('tc-adm-no');
  if (elAdm) elAdm.innerText = c.admission_no || '--';

  const elTNo = document.getElementById('tc-t-no');
  if (elTNo) elTNo.innerText = c.t_no || '--';

  const elName = document.getElementById('tc-name');
  if (elName) elName.innerText = (c.student_name || '--').toUpperCase();

  const elFather = document.getElementById('tc-father');
  if (elFather) elFather.innerText = (c.father_name || '--').toUpperCase();

  const elPin = document.getElementById('tc-pin');
  if (elPin) elPin.innerText = c.student_pin || '--';

  // Combined Nationality, Religion e.g. "INDIAN-HINDU-KALINGA-BC-A" or "INDIAN - HINDU"
  const elNatRel = document.getElementById('tc-nat-rel');
  if (elNatRel) {
    const nat = (c.nationality || 'INDIAN').trim().toUpperCase();
    const rel = (c.religion || '').trim().toUpperCase();
    if (rel) {
      if (rel.startsWith(nat)) {
        elNatRel.innerText = rel;
      } else {
        elNatRel.innerText = `${nat}-${rel}`;
      }
    } else {
      elNatRel.innerText = nat;
    }
  }

  const elDob = document.getElementById('tc-dob');
  if (elDob) elDob.innerText = c.dob || '--';

  const elDobWords = document.getElementById('tc-dob-words');
  if (elDobWords) elDobWords.innerText = dateToWords(c.dob);

  const elCourse = document.getElementById('tc-course');
  if (elCourse) elCourse.innerText = formatClassStudied(c.course_branch);

  const elDoa = document.getElementById('tc-doa');
  if (elDoa) elDoa.innerText = c.date_of_admission || '--';

  const elLeaving = document.getElementById('tc-leaving');
  if (elLeaving) elLeaving.innerText = c.date_of_leaving || '--';

  const elPromotion = document.getElementById('tc-promotion');
  if (elPromotion) elPromotion.innerText = c.promotion_status || '--';

  const elConduct = document.getElementById('tc-conduct');
  if (elConduct) elConduct.innerText = c.conduct_character || '--';

  const elDues = document.getElementById('tc-dues-paid');
  if (elDues) elDues.innerText = (c.fees_paid || 'YES').toUpperCase() === 'YES' ? 'YES' : 'NO';

  const elAppDate = document.getElementById('tc-app-date');
  if (elAppDate) elAppDate.innerText = c.generated_date || c.application_date || '--';

  const elClerkDate = document.getElementById('tc-clerk-date');
  if (elClerkDate) {
    const d = c.generated_date ? c.generated_date.replace(/-/g, '/') : '';
    elClerkDate.innerText = d;
  }

  const banner = document.getElementById('doc-version-banner');
  if (banner) {
    banner.innerText = `Version v${c.version_number} (${c.is_current ? 'Current Active' : 'Superseded Internal Copy'})`;
  }
}

function populateConduct(c) {
  const elNo = document.getElementById('sc-adm-no');
  if (elNo) elNo.innerText = c.admission_no || c.t_no || '--';

  const elDate = document.getElementById('sc-date');
  if (elDate) elDate.innerText = c.generated_date ? c.generated_date.replace(/-/g, '.') : '--';

  const elName = document.getElementById('sc-name');
  if (elName) elName.innerText = (c.student_name || '--').toUpperCase();

  const elPin = document.getElementById('sc-pin');
  if (elPin) elPin.innerText = c.student_pin || '--';

  const elFather = document.getElementById('sc-father');
  if (elFather) elFather.innerText = (c.father_name || '--').toUpperCase();

  const elPeriod = document.getElementById('sc-period');
  if (elPeriod) {
    const fromDate = c.date_of_admission ? c.date_of_admission.replace(/-/g, '.') : '--';
    const toDate = c.date_of_leaving || 'May/June-2026';
    elPeriod.innerText = `${fromDate} to ${toDate}`;
  }

  const elConduct = document.getElementById('sc-conduct');
  if (elConduct) elConduct.innerText = c.conduct_character || 'Satisfactory';

  const elClerkDate = document.getElementById('sc-clerk-date');
  if (elClerkDate) {
    const d = c.generated_date ? c.generated_date.replace(/-/g, '/') : '';
    elClerkDate.innerText = d;
  }
}
