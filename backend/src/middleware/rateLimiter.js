// In-Memory IP-based Rate Limiter for Login & Authentication Endpoints

const loginAttempts = new Map();

// Configuration: Max 15 login attempts per 15 minutes per IP
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 15;

function loginRateLimiter(req, res, next) {
  const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
  const now = Date.now();

  const record = loginAttempts.get(ip) || { count: 0, firstAttempt: now };

  // Reset window if expired
  if (now - record.firstAttempt > WINDOW_MS) {
    record.count = 0;
    record.firstAttempt = now;
  }

  record.count += 1;
  loginAttempts.set(ip, record);

  if (record.count > MAX_ATTEMPTS) {
    const minutesLeft = Math.ceil((WINDOW_MS - (now - record.firstAttempt)) / 60000);
    return res.status(429).json({
      success: false,
      error: `Too many login attempts from this network. Please try again in ${minutesLeft} minute(s).`
    });
  }

  // Hook into response to reset counter on successful authentication
  const originalJson = res.json.bind(res);
  res.json = (data) => {
    if (res.statusCode === 200 && data && data.success && data.token) {
      loginAttempts.delete(ip); // Reset counter on valid login
    }
    return originalJson(data);
  };

  next();
}

// Clean up stale IP records every 30 minutes to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of loginAttempts.entries()) {
    if (now - record.firstAttempt > WINDOW_MS) {
      loginAttempts.delete(ip);
    }
  }
}, 30 * 60 * 1000);

module.exports = {
  loginRateLimiter
};
