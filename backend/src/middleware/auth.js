const { verifyToken } = require('../utils/helpers');

function extractToken(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;
  const parts = authHeader.split(' ');
  if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
    return parts[1];
  }
  return null;
}

function requireClerk(req, res, next) {
  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({ success: false, error: 'Authentication required. No token provided.' });
  }

  const payload = verifyToken(token);
  if (!payload || payload.role !== 'clerk') {
    return res.status(403).json({ success: false, error: 'Unauthorized: Clerk access only.' });
  }

  req.user = payload;
  next();
}

function requireFaculty(req, res, next) {
  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({ success: false, error: 'Authentication required. No token provided.' });
  }

  const payload = verifyToken(token);
  if (!payload || payload.role !== 'faculty') {
    return res.status(403).json({ success: false, error: 'Unauthorized: Faculty access only.' });
  }

  req.user = payload;
  req.faculty = {
    id: payload.id,
    username: payload.username,
    department_id: payload.department_id,
    department_name: payload.department_name
  };
  next();
}

function requireStudent(req, res, next) {
  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({ success: false, error: 'Authentication required. No token provided.' });
  }

  const payload = verifyToken(token);
  if (!payload || payload.role !== 'student') {
    return res.status(403).json({ success: false, error: 'Unauthorized: Student access only.' });
  }

  req.user = payload;
  req.student = {
    pin: payload.pin,
    student_name: payload.student_name,
    course_branch: payload.course_branch
  };
  next();
}

function authenticateOptional(req, res, next) {
  const token = extractToken(req);
  if (token) {
    req.user = verifyToken(token);
  }
  next();
}

module.exports = {
  requireClerk,
  requireFaculty,
  requireStudent,
  authenticateOptional
};
