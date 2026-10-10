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

  // Strategy 2: Pre-warm & Keep-Alive Render Free Tier Backend
  prewarm() {
    try {
      const baseUrl = (window.APP_CONFIG && window.APP_CONFIG.API_BASE_URL) || 'http://localhost:5000/api';
      let healthUrl = '/api/health';
      if (baseUrl.startsWith('http')) {
        healthUrl = baseUrl.replace(/\/api\/?$/, '') + '/health';
      }
      if (typeof fetch === 'function') {
        fetch(healthUrl, { mode: 'no-cors', cache: 'no-store', keepalive: true }).catch(() => {});
      }
      this._lastPingTime = Date.now();
    } catch (e) {}
  },

  startHeartbeat() {
    // 1. Initial wake-up ping immediately when script loads
    this.prewarm();

    // 2. Active keep-alive heartbeat every 8 minutes (Render sleeps after 15 min of inactivity)
    if (!this._heartbeatInterval) {
      this._heartbeatInterval = setInterval(() => {
        this.prewarm();
      }, 8 * 60 * 1000);
    }

    // 3. Re-ping when tab becomes active again if idle > 5 minutes
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          const elapsed = Date.now() - (this._lastPingTime || 0);
          if (elapsed > 5 * 60 * 1000) {
            this.prewarm();
          }
        }
      });

      // 4. Opportunistic pre-warming on interactive intent (hover/focus on buttons or forms)
      document.addEventListener('mouseover', (e) => {
        const target = e.target.closest('button, a, input, select');
        if (target && !this._hoverPrewarmed) {
          this._hoverPrewarmed = true;
          this.prewarm();
          setTimeout(() => { this._hoverPrewarmed = false; }, 60000);
        }
      }, { passive: true });
    }
  },

  // Live Cloud Server Connection Status Pill (Option 1 & 3)
  initServerStatusPill() {
    if (typeof document === 'undefined') return;
    if (document.getElementById('server-status-pill')) return;

    // Target header-actions, print-bar, or fallback to header container
    const target = document.querySelector('.header-actions') || document.querySelector('.print-bar') || document.querySelector('.header-container');
    if (!target) return;

    const pill = document.createElement('div');
    pill.id = 'server-status-pill';
    pill.className = 'server-status-pill standby';
    pill.title = 'Cloud server status. Click to test connection.';
    pill.innerHTML = `
      <span class="status-dot pulsing-amber"></span>
      <span class="status-text-full">Waking up cloud server... (~25s)</span>
      <span class="status-text-mini">Waking...</span>
    `;

    pill.addEventListener('click', () => {
      this.checkServerConnection(true);
    });

    if (target.firstChild) {
      target.insertBefore(pill, target.firstChild);
    } else {
      target.appendChild(pill);
    }

    this.checkServerConnection();
  },

  async checkServerConnection(isManual = false) {
    if (isManual) {
      this.showToast('Checking server connection...', 'info', 1800);
    }

    const baseUrl = (window.APP_CONFIG && window.APP_CONFIG.API_BASE_URL) || 'http://localhost:5000/api';
    let healthUrl = '/api/health';
    if (baseUrl.startsWith('http')) {
      healthUrl = baseUrl.replace(/\/api\/?$/, '') + '/health';
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 7000);

      const res = await fetch(healthUrl, {
        signal: controller.signal,
        cache: 'no-store'
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        this.setServerConnected(true);
        if (isManual) this.showToast('Server is online and ready! 🟢', 'success', 2500);
        return true;
      } else {
        throw new Error('Not OK');
      }
    } catch (err) {
      this.setServerConnected(false);
      // Auto-poll every 3.5 seconds until server boots
      if (!this._pollTimer) {
        this._pollTimer = setTimeout(() => {
          this._pollTimer = null;
          this.checkServerConnection();
        }, 3500);
      }
      return false;
    }
  },

  setServerConnected(connected) {
    const pill = document.getElementById('server-status-pill');
    if (!pill) return;

    if (connected) {
      pill.className = 'server-status-pill connected';
      pill.innerHTML = `
        <span class="status-dot solid-green"></span>
        <span class="status-text-full">🟢 Server Connected!</span>
        <span class="status-text-mini">Online</span>
      `;
      if (this._minimizeTimer) clearTimeout(this._minimizeTimer);
      this._minimizeTimer = setTimeout(() => {
        if (pill) pill.classList.add('minimized');
      }, 4000);

      this.hideColdStartIndicator();
    } else {
      pill.classList.remove('minimized');
      pill.className = 'server-status-pill standby';
      pill.innerHTML = `
        <span class="status-dot pulsing-amber"></span>
        <span class="status-text-full">Waking up cloud server... (~25s)</span>
        <span class="status-text-mini">Waking...</span>
      `;
    }
  },

  // Strategy 3: Cold-Start UI Indicators
  showColdStartIndicator() {
    let el = document.getElementById('render-cold-start-banner');
    if (!el) {
      el = document.createElement('div');
      el.id = 'render-cold-start-banner';
      el.className = 'cold-start-banner';
      el.innerHTML = `
        <div class="cold-start-content">
          <div class="cold-start-spinner"></div>
          <div>
            <strong>Connecting to Cloud Server...</strong>
            <p>Render free instance is waking up from idle mode (~30s on first load). Please wait, your request is running automatically.</p>
          </div>
        </div>
      `;
      document.body.appendChild(el);
    }
    setTimeout(() => {
      if (el) el.classList.add('visible');
    }, 10);
  },

  hideColdStartIndicator() {
    const el = document.getElementById('render-cold-start-banner');
    if (el) {
      el.classList.remove('visible');
      setTimeout(() => {
        if (el && el.parentNode) el.parentNode.removeChild(el);
      }, 350);
    }
  },

  // Strategy 6: Cache-First Helpers (Stale-While-Revalidate)
  getCache(key) {
    try {
      const raw = localStorage.getItem(`svgp_cache_${key}`);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  setCache(key, data) {
    try {
      localStorage.setItem(`svgp_cache_${key}`, JSON.stringify(data));
    } catch (e) {}
  },

  clearCache(key) {
    try {
      if (key) {
        localStorage.removeItem(`svgp_cache_${key}`);
      } else {
        Object.keys(localStorage).forEach(k => {
          if (k.startsWith('svgp_cache_')) localStorage.removeItem(k);
        });
      }
    } catch (e) {}
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

    // Trigger Cold Start reassurance banner if request takes longer than 2.2 seconds
    let coldStartTimer = null;
    if (!options._isBackground) {
      coldStartTimer = setTimeout(() => {
        this.showColdStartIndicator();
      }, 2200);
    }

    const retryCount = options._retryCount || 0;
    const maxRetries = options.retries !== undefined ? options.retries : 3;

    try {
      const res = await fetch(url, {
        ...options,
        headers
      });

      if (coldStartTimer) clearTimeout(coldStartTimer);
      this.hideColdStartIndicator();
      this.setServerConnected(true);

      // Check for temporary Render 502/503 during boot
      if ((res.status === 502 || res.status === 503) && retryCount < maxRetries) {
        this.setServerConnected(false);
        this.showColdStartIndicator();
        await new Promise(r => setTimeout(r, 2500));
        return this.request(endpoint, { ...options, _retryCount: retryCount + 1 });
      }

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
      if (coldStartTimer) clearTimeout(coldStartTimer);

      // If connection dropped during container boot, retry up to maxRetries
      if (retryCount < maxRetries) {
        this.setServerConnected(false);
        this.showColdStartIndicator();
        await new Promise(r => setTimeout(r, 2500));
        return this.request(endpoint, { ...options, _retryCount: retryCount + 1 });
      }

      this.hideColdStartIndicator();
      console.error('API Request failed after retries:', err);
      return {
        ok: false,
        status: 0,
        data: { error: 'Network error or backend is waking up. Please retry in a few moments.' }
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
    if (window.location.pathname.includes('certificate-view') || window.location.href.includes('certificate-view')) return;
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

    const runInits = () => {
      this.updateThemeButton();
      this.initBranding();
      this.initKeyboardShortcuts();
      this.initDesktopBanner();
      this.initBackToTop();
      this.initServerStatusPill();
    };

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', runInits);
    } else {
      runInits();
    }
  },

  escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str).replace(/[&<>"']/g, m => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[m]));
  },

  formatDateTime(dateStr) {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      return isNaN(d.getTime()) ? String(dateStr) : d.toLocaleString();
    } catch {
      return String(dateStr);
    }
  }
};

function escapeHtml(str) {
  return API.escapeHtml(str);
}
window.escapeHtml = escapeHtml;

API.initTheme();
API.startHeartbeat();
window.API = API;



