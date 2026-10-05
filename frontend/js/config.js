// Centralized Application Configuration
// Update this single file to configure your College details, branding, and API endpoint.

const APP_CONFIG = {
  // If backend & frontend run on same server (Render Web Service or port 5000), /api is used automatically.
  // If frontend is deployed separately to GitHub Pages, it connects to your Render backend API.
  API_BASE_URL: (() => {
    try {
      const stored = localStorage.getItem('svgp_api_base_url');
      if (stored) return stored.trim();
    } catch (e) {}

    // 1. Same-origin or full-stack Render deployment
    if (window.location.port === '5000' || (window.location.hostname && window.location.hostname.includes('onrender.com'))) {
      return '/api';
    }

    // 2. Localhost development
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:' || !window.location.hostname) {
      return 'http://localhost:5000/api';
    }

    // 3. GitHub Pages deployment: connect to Render backend
    if (window.location.hostname && window.location.hostname.includes('github.io')) {
      return 'https://svgptc-management-portal.onrender.com/api';
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

// Strategy 2: Immediate Early Pre-warm Ping for Render Free Tier
// Wakes up Render backend immediately when user arrives on GitHub Pages
(function earlyPrewarmBackend() {
  try {
    const base = APP_CONFIG.API_BASE_URL || '/api';
    const healthUrl = base.endsWith('/api') ? `${base}/health` : `${base}/api/health`;
    if (typeof fetch === 'function') {
      fetch(healthUrl, { mode: 'no-cors', cache: 'no-store' }).catch(() => {});
    }
  } catch (e) {}
})();

