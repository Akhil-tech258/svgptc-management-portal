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

    // Optional Watermark branding if defined in config
    const watermarkPath = col.WATERMARK_PATH || col.LOGO_PATH;
    if (watermarkPath) {
      const tcWm = document.getElementById('tc-watermark');
      if (tcWm) tcWm.src = watermarkPath;
      const scWm = document.getElementById('sc-watermark');
      if (scWm) scWm.src = watermarkPath;
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

  let endpoint = `/certificates/${encodeURIComponent(pin)}`;
  if (version) {
    endpoint += `/version/${encodeURIComponent(version)}`;
  }

  const res = await API.request(endpoint);
  if (!res.ok) {
    alert(res.data.error || 'Failed to load official certificate record.');
    return;
  }

  const cert = res.data.certificate;
  if (!cert) {
    alert('Certificate data is empty.');
    return;
  }

  populateTC(cert);
  populateConduct(cert);
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
