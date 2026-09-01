const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT id, name, type FROM departments WHERE is_active = 1 ORDER BY id ASC');
    return res.json({ success: true, departments: result.rows });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Failed to fetch departments.' });
  }
});

module.exports = router;
