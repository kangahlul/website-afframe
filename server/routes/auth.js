const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../db');
const { authenticateToken, JWT_SECRET } = require('../middleware/auth');

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email dan kata sandi wajib diisi.' });
    }

    const user = await db.prepare('SELECT * FROM admin_users WHERE email = ? OR username = ?').get(email, email);
    if (!user) {
      return res.status(401).json({ error: 'Kredensial tidak valid. Silakan periksa email dan kata sandi Anda.' });
    }

    const isValid = bcrypt.compareSync(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Kredensial tidak valid. Silakan periksa email dan kata sandi Anda.' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login berhasil.',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/auth/me
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await db.prepare('SELECT id, username, email, role, created_at FROM admin_users WHERE id = ?').get(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'Pengguna tidak ditemukan.' });
    }
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/change-password
router.post('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Kata sandi saat ini dan kata sandi baru wajib diisi.' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'Kata sandi baru minimal harus 8 karakter.' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: 'Konfirmasi kata sandi baru tidak cocok.' });
    }

    const user = await db.prepare('SELECT * FROM admin_users WHERE id = ?').get(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'Pengguna tidak ditemukan.' });
    }

    const isValid = bcrypt.compareSync(currentPassword, user.password_hash);
    if (!isValid) {
      return res.status(400).json({ error: 'Kata sandi saat ini salah.' });
    }

    const newHash = bcrypt.hashSync(newPassword, 10);
    await db.prepare('UPDATE admin_users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(newHash, user.id);

    res.json({ message: 'Kata sandi berhasil diperbarui.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
