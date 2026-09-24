// Reusable API Client and Frontend Utilities

const API = {
  getToken() {
    return localStorage.getItem('auth_token');
  },

  setAuth(token, user) {
    localStorage.setItem('auth_token', token);
    localStorage.setItem('auth_user', JSON.stringify(user));
  },

  getUser() {
    const raw = localStorage.getItem('auth_user');
    try {
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  logout(redirectPath = 'index.html') {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    window.location.href = redirectPath;
  },

  async request(endpoint, options = {}) {
    const baseUrl = (window.APP_CONFIG && window.APP_CONFIG.API_BASE_URL) || 'http://localhost:5000/api';
    const url = endpoint.startsWith('http') ? endpoint : `${baseUrl}${endpoint}`;

    const headers = { ...options.headers };
    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
      if (options.body && typeof options.body === 'object') {
        options.body = JSON.stringify(options.body);
      }
    }

    try {
      const res = await fetch(url, {
        ...options,
        headers
      });

      if (res.status === 401) {
        // If unauthorized, don't auto-redirect on registration/login attempts
        if (!endpoint.includes('/login') && !endpoint.includes('/register')) {
          this.showToast('Session expired. Please log in again.', 'warning');
          setTimeout(() => {
            this.logout('index.html');
          }, 1500);
        }
      }

      const data = await res.json();
      return { ok: res.ok, status: res.status, data };
    } catch (err) {
      console.error('API Request failed:', err);
      return {
        ok: false,
        status: 0,
        data: { error: 'Network error or backend is not reachable. Check server connection.' }
      };
    }
  },

  // Toast Notification System
  showToast(message, type = 'info', duration = 4000) {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let icon = 'ℹ️';
    if (type === 'success') icon = '✅';
    if (type === 'error') icon = '⚠️';
    if (type === 'warning') icon = '🔔';

    toast.innerHTML = `
      <div class="toast-content">
        <span class="toast-icon">${icon}</span>
        <span class="toast-message">${message}</span>
      </div>
      <button class="toast-close" onclick="this.parentElement.remove()">&times;</button>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      if (toast.parentElement) {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(20px)';
        setTimeout(() => toast.remove(), 300);
      }
    }, duration);
  },

  // Theme Management (Default: Light / White Theme)
  getTheme() {
    return localStorage.getItem('app_theme') || 'light';
  },

  setTheme(theme) {
    localStorage.setItem('app_theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
    this.updateThemeButton();
  },

  toggleTheme() {
    const next = this.getTheme() === 'dark' ? 'light' : 'dark';
    this.setTheme(next);
  },

  updateThemeButton() {
    const isLight = this.getTheme() === 'light';
    const btns = document.querySelectorAll('.theme-toggle-btn');
    btns.forEach(btn => {
      btn.innerHTML = isLight ? '🌙 Dark Mode' : '☀️ Light Mode';
      btn.title = `Currently in ${isLight ? 'Light' : 'Dark'} Mode. Click to toggle.`;
    });
  },


  initBranding() {
    if (!window.APP_CONFIG || !window.APP_CONFIG.COLLEGE) return;
    const c = window.APP_CONFIG.COLLEGE;
    document.querySelectorAll('.college-crest, #college-crest-img').forEach(img => {
      img.src = c.LOGO_PATH || 'assets/logo.png';
      img.alt = `${c.NAME} Crest`;
    });
    const nameEl = document.getElementById('college-name-display');
    if (nameEl) nameEl.innerText = c.NAME;
    const subEl = document.getElementById('college-subtitle-display');
    if (subEl) subEl.innerText = c.SUBTITLE;
  },

  // Password Visibility Toggle
  togglePassword(inputId, btn) {
    const input = document.getElementById(inputId);
    if (!input) return;
    if (input.type === 'password') {
      input.type = 'text';
      btn.innerHTML = '👁️‍🗨️';
      btn.title = 'Hide Password';
    } else {
      input.type = 'password';
      btn.innerHTML = '👁️';
      btn.title = 'Show Password';
    }
  },

  // Mobile Navigation Drawer Toggle
  toggleMobileMenu(forceOpen) {
    const drawer = document.getElementById('mobile-nav-drawer');
    const backdrop = document.getElementById('mobile-nav-backdrop');
    if (!drawer || !backdrop) return;
    
    const isOpen = drawer.classList.contains('open');
    const shouldOpen = forceOpen !== undefined ? forceOpen : !isOpen;

    if (shouldOpen) {
      drawer.classList.add('open');
      backdrop.classList.add('open');
      document.body.style.overflow = 'hidden';
    } else {
      drawer.classList.remove('open');
      backdrop.classList.remove('open');
      document.body.style.overflow = '';
    }
  },

  // Expandable FAQ Accordion
  toggleFaq(faqItem) {
    if (!faqItem) return;
    const isActive = faqItem.classList.contains('active');
    // Close other FAQ items in same list
    const parent = faqItem.closest('.faq-list');
    if (parent) {
      parent.querySelectorAll('.faq-item').forEach(item => item.classList.remove('active'));
    }
    if (!isActive) {
      faqItem.classList.add('active');
    }
  },

  initDesktopBanner() {
    if (window.innerWidth > 1024) return;
    const isDismissed = localStorage.getItem('desktop_banner_dismissed') === 'true';
    if (isDismissed) return;

    let banner = document.getElementById('desktop-recommend-banner');
    if (!banner) {
      const container = document.querySelector('.main-container');
      if (!container) return;
      banner = document.createElement('div');
      banner.id = 'desktop-recommend-banner';
      banner.className = 'desktop-recommend-banner active';
      banner.innerHTML = `
        <div style="display:flex; align-items:center; gap:0.6rem;">
          <span style="font-size:1.2rem;">💻</span>
          <span><strong>Desktop Site Recommended:</strong> For the best clearance management experience and certificate view, use a Desktop/Laptop or switch your mobile browser to "Desktop site".</span>
        </div>
        <button class="desktop-banner-close" onclick="API.dismissDesktopBanner()" title="Dismiss">&times;</button>
      `;
      container.insertBefore(banner, container.firstChild);
    } else {
      banner.classList.add('active');
    }
  },

  dismissDesktopBanner() {
    localStorage.setItem('desktop_banner_dismissed', 'true');
    const banner = document.getElementById('desktop-recommend-banner');
    if (banner) banner.classList.remove('active');
  },


  // Render Empty State Helper
  renderEmptyState(container, title = 'No records found', desc = 'There is currently no data to display.', icon = '📭') {
    if (!container) return;
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">${icon}</div>
        <div class="empty-state-title">${title}</div>
        <div class="empty-state-desc">${desc}</div>
      </div>
    `;
  },

  // Skeleton Loader Helper
  renderSkeletonCards(container, count = 3) {
    if (!container) return;
    let html = '';
    for (let i = 0; i < count; i++) {
      html += `
        <div class="skeleton skeleton-card" style="height:110px; margin-bottom:1rem;"></div>
      `;
    }
    container.innerHTML = html;
  },

  renderSkeletonTable(tbody, rows = 4, cols = 5) {
    if (!tbody) return;
    let html = '';
    for (let r = 0; r < rows; r++) {
      html += '<tr>';
      for (let c = 0; c < cols; c++) {
        html += `<td><div class="skeleton" style="height:16px; width:${Math.floor(Math.random() * 40 + 50)}%;"></div></td>`;
      }
      html += '</tr>';
    }
    tbody.innerHTML = html;
  },

  // 1-Click CSV / Excel Export Helper
  exportToCSV(filename, rows, headers = []) {
    if (!rows || !rows.length) {
      this.showToast('No data available to export.', 'info');
      return;
    }

    const headerKeys = headers.length ? headers.map(h => h.key) : Object.keys(rows[0]);
    const headerLabels = headers.length ? headers.map(h => h.label) : headerKeys;

    const csvLines = [];
    csvLines.push(headerLabels.map(label => `"${String(label).replace(/"/g, '""')}"`).join(','));

    rows.forEach(row => {
      const line = headerKeys.map(key => {
        const raw = row[key];
        const val = raw !== undefined && raw !== null ? raw : '';
        return `"${String(val).replace(/"/g, '""')}"`;
      }).join(',');
      csvLines.push(line);
    });

    const csvContent = '\uFEFF' + csvLines.join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const downloadName = filename.endsWith('.csv') ? filename : `${filename}.csv`;

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', downloadName);
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();

    setTimeout(() => {
      if (link.parentNode) {
        document.body.removeChild(link);
      }
      URL.revokeObjectURL(url);
    }, 1500);

    this.showToast(`Exported ${rows.length} records to ${downloadName}.`, 'success');
  },

  // Floating Back to Top Button
  initBackToTop() {
    if (document.getElementById('back-to-top-btn')) return;
    const btn = document.createElement('button');
    btn.id = 'back-to-top-btn';
    btn.className = 'back-to-top-btn';
    btn.innerHTML = '▲';
    btn.title = 'Back to top';
    btn.onclick = () => window.scrollTo({ top: 0, behavior: 'smooth' });
    document.body.appendChild(btn);

    window.addEventListener('scroll', () => {
      if (window.scrollY > 250) {
        btn.classList.add('visible');
      } else {
        btn.classList.remove('visible');
      }
    });
  },

  // Keyboard Shortcuts Handler
  initKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
      const isInput = activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select';

      // 1. Esc key: closes modals, drawer menu, search dropdowns
      if (e.key === 'Escape') {
        API.toggleMobileMenu(false);
        const modals = document.querySelectorAll('.modal-backdrop');
        modals.forEach(el => el.style.display = 'none');
        return;
      }

      // 2. Alt + T: Toggle Theme
      if (e.altKey && (e.key === 't' || e.key === 'T')) {
        e.preventDefault();
        API.toggleTheme();
        return;
      }

      // 3. Alt + H: Navigate Home
      if (e.altKey && (e.key === 'h' || e.key === 'H')) {
        e.preventDefault();
        window.location.href = 'index.html';
        return;
      }

      // 4. Alt + L: Logout if authenticated
      if (e.altKey && (e.key === 'l' || e.key === 'L')) {
        if (API.getToken()) {
          e.preventDefault();
          API.logout('index.html');
          return;
        }
      }

      // 5. Ctrl + K or Cmd + K: Focus primary search bar if on page
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
        const searchInput = document.querySelector('#filter-search, #due-student-search, #search-student-input, #clerk-student-search, #search-master-input');
        if (searchInput) {
          e.preventDefault();
          searchInput.focus();
        }
      }
    });
  },

  initTheme() {
    const current = this.getTheme();
    document.documentElement.setAttribute('data-theme', current);
    document.addEventListener('DOMContentLoaded', () => {
      this.updateThemeButton();
      this.initBranding();
      this.initKeyboardShortcuts();
      this.initDesktopBanner();
      this.initBackToTop();
    });
  }
};

API.initTheme();
window.API = API;


