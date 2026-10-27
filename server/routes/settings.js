const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { authenticateToken } = require('../middleware/auth');

// GET /api/settings - Public: returns all settings as a key-value dictionary
router.get('/', async (req, res) => {
  try {
    const rows = await db.prepare('SELECT key, value, type, group_name FROM site_settings').all();
    const settings = {};
    for (const row of rows) {
      settings[row.key] = row.value;
    }
    res.json({ settings, list: rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/settings - Admin: batch update settings
router.put('/', authenticateToken, async (req, res) => {
  try {
    const updates = req.body; // e.g. { brand_name: "AFFRAME", whatsapp_number: "085755152579", ... }

    if (!updates || typeof updates !== 'object') {
      return res.status(400).json({ error: 'Payload pengaturan tidak valid.' });
    }

    const checkStmt = db.prepare('SELECT id FROM site_settings WHERE key = ?');
    const updateStmt = db.prepare('UPDATE site_settings SET value = ?, updated_at = CURRENT_TIMESTAMP WHERE key = ?');
    const insertStmt = db.prepare('INSERT INTO site_settings (key, value, group_name) VALUES (?, ?, ?)');

    for (const [key, value] of Object.entries(updates)) {
      const strVal = typeof value === 'object' ? JSON.stringify(value) : String(value ?? '');
      const exists = await checkStmt.get(key);
      if (exists) {
        await updateStmt.run(strVal, key);
      } else {
        await insertStmt.run(key, strVal, 'custom');
      }
    }

    const rows = await db.prepare('SELECT key, value, type, group_name FROM site_settings').all();
    const settings = {};
    for (const row of rows) {
      settings[row.key] = row.value;
    }

    res.json({ message: 'Pengaturan website berhasil disimpan.', settings });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
