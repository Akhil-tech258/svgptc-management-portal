const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT id, code, name FROM branches WHERE is_active = 1 ORDER BY name ASC');
    return res.json({ success: true, branches: result.rows });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Failed to fetch branches.' });
  }
});

module.exports = router;
