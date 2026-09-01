// Certificate Rendering and Print Logic

document.addEventListener('DOMContentLoaded', () => {
  initBranding();
  loadCertificate();
});

function initBranding() {
  if (window.APP_CONFIG && window.APP_CONFIG.COLLEGE) {
    const col = window.APP_CONFIG.COLLEGE;
    
    document.getElementById('cert-college-name').innerText = col.NAME;
    document.getElementById('cert-college-sub').innerText = col.SUBTITLE;
    document.getElementById('cert-college-code').innerText = `INST CODE: ${col.INSTITUTION_CODE} | ${col.AFFILIATION}`;
    document.getElementById('cert-crest-img').src = col.LOGO_PATH;

    document.getElementById('cert-college-name-2').innerText = col.NAME;
    document.getElementById('cert-college-sub-2').innerText = col.SUBTITLE;
    document.getElementById('cert-college-code-2').innerText = `INST CODE: ${col.INSTITUTION_CODE}`;
    document.getElementById('cert-crest-img-2').src = col.LOGO_PATH;
  }
}

async function loadCertificate() {
  const user = API.getUser();
  if (!user || user.role !== 'clerk') {
    document.body.innerHTML = `
      <div style="max-width:500px; margin:4rem auto; text-align:center; padding:2.5rem; background:#111827; border:1px solid #2e384d; border-radius:12px; color:#f8fafc; font-family:sans-serif;">
        <div style="font-size:2.8rem; margin-bottom:1rem;">🏛️</div>
        <h2 style="margin-bottom:0.6rem;">Administrative Access Only</h2>
        <p style="color:#94a3b8; font-size:0.9rem; line-height:1.5; margin-bottom:1.5rem;">
          Official Transfer and Conduct Certificates can only be accessed and printed by the Administrative Clerk.
        </p>
        <a href="clerk.html" style="display:inline-block; padding:0.6rem 1.4rem; background:#4692c7; color:#fff; text-decoration:none; border-radius:6px; font-weight:600;">Go to Clerk Portal &rarr;</a>
      </div>
    `;
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const pin = params.get('pin');
  const version = params.get('version');


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

function populateTC(c) {
  document.getElementById('tc-t-no').innerText = c.t_no || '--';
  document.getElementById('tc-adm-no').innerText = c.admission_no || '--';
  document.getElementById('tc-issue-date').innerText = c.generated_date || '--';

  document.getElementById('tc-name').innerText = c.student_name || '--';
  document.getElementById('tc-father').innerText = c.father_name || '--';
  document.getElementById('tc-pin').innerText = c.student_pin || '--';
  document.getElementById('tc-nat').innerText = c.nationality || 'Indian';
  document.getElementById('tc-rel').innerText = c.religion || '--';
  document.getElementById('tc-dob').innerText = c.dob || '--';
  document.getElementById('tc-course').innerText = c.course_branch || '--';
  document.getElementById('tc-doa').innerText = c.date_of_admission || '--';
  document.getElementById('tc-leaving').innerText = c.date_of_leaving || '--';
  document.getElementById('tc-dues-paid').innerText = (c.fees_paid || 'No').toUpperCase() === 'YES' ? 'YES (All Dues Cleared)' : 'NO';
  document.getElementById('tc-promotion').innerText = c.promotion_status || '--';
  document.getElementById('tc-conduct').innerText = c.conduct_character || 'Good';

  const institutionFooter = 'Sri Venkateswara Government Polytechnic, Tirupati';
  const tcTag = document.getElementById('tc-version-tag');
  if (tcTag) {
    tcTag.innerText = institutionFooter;
  }
  document.getElementById('doc-version-banner').innerText = `Version v${c.version_number} (${c.is_current ? 'Current Active' : 'Superseded Internal Copy'})`;
}

function populateConduct(c) {
  document.getElementById('sc-ref-no').innerText = `${c.t_no || '00'}/${c.student_pin || ''}`;
  document.getElementById('sc-issue-date').innerText = c.generated_date || '--';

  document.getElementById('sc-name').innerText = c.student_name || '--';
  document.getElementById('sc-father').innerText = c.father_name || '--';
  document.getElementById('sc-pin').innerText = c.student_pin || '--';
  document.getElementById('sc-course').innerText = c.course_branch || '--';
  document.getElementById('sc-doa').innerText = c.date_of_admission || '--';
  document.getElementById('sc-leaving').innerText = c.date_of_leaving || '--';
  document.getElementById('sc-conduct').innerText = (c.conduct_character || 'Good').toUpperCase();

  const institutionFooter = 'Sri Venkateswara Government Polytechnic, Tirupati';
  const scTag = document.getElementById('sc-version-tag');
  if (scTag) {
    scTag.innerText = institutionFooter;
  }
}
