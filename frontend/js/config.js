// Centralized Application Configuration
// Update this single file to configure your College details, branding, and API endpoint.

const APP_CONFIG = {
  // If backend & frontend run on same server (Render Web Service or port 5000), /api is used automatically.
  // If frontend is deployed separately to GitHub Pages, set this to: "https://your-backend.onrender.com/api"
  API_BASE_URL: (() => {
    if (window.location.port === '5000' || window.location.hostname.includes('onrender.com')) {
      return '/api';
    }
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:5000/api';
    }
    return '/api';
  })(),


  // College Branding & Certificate Header Data
  COLLEGE: {
    NAME: 'SRI VENKATESWARA GOVERNMENT POLYTECHNIC (SVGP)',
    SUBTITLE: 'Government Autonomous Polytechnic | Approved by AICTE & SBTET, Andhra Pradesh',
    ADDRESS: 'K.T. Road, Near Alipiri, Tirupati, Andhra Pradesh - 517507',
    INSTITUTION_CODE: '018',
    AFFILIATION: 'State Board of Technical Education and Training (SBTET), Andhra Pradesh',
    LOGO_PATH: 'assets/logo.png',
    PHONE: '+91 877 228 7234',
    EMAIL: 'principal.svgptpt@gmail.com'
  }
};

window.APP_CONFIG = APP_CONFIG;
