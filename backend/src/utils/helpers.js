const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'student-tc-super-secret-key-2026';

function deriveTNo(pin) {
  if (!pin || typeof pin !== 'string') return '';
  const cleanPin = pin.trim();
  const last3 = cleanPin.slice(-3);
  // Remove leading zeros, but if it was '000', return '0'
  const tNo = last3.replace(/^0+/, '') || '0';
  return tNo;
}

function isValidDateFormat(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return false;
  // Match DD-MM-YYYY
  const regex = /^(\d{2})-(\d{2})-(\d{4})$/;
  const match = dateStr.trim().match(regex);
  if (!match) return false;
  const day = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const year = parseInt(match[3], 10);

  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;
  if (year < 1900 || year > 2100) return false;
  return true;
}

function hashPassword(plainText) {
  const salt = bcrypt.genSaltSync(10);
  return bcrypt.hashSync(plainText, salt);
}

function comparePassword(plainText, hash) {
  return bcrypt.compareSync(plainText, hash);
}

function generateToken(payload, expiresIn = '24h') {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

function getTodayFormatted() {
  const today = new Date();
  const d = String(today.getDate()).padStart(2, '0');
  const m = String(today.getMonth() + 1).padStart(2, '0');
  const y = today.getFullYear();
  return `${d}-${m}-${y}`;
}

module.exports = {
  deriveTNo,
  isValidDateFormat,
  hashPassword,
  comparePassword,
  generateToken,
  verifyToken,
  getTodayFormatted
};
