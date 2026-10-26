const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { db } = require('../db');
const { authenticateToken } = require('../middleware/auth');

const uploadsDir = path.join(__dirname, '../uploads');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const safeName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${safeName}-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB limit
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp|svg|gif|mp4|webm|mov/;
    const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
    const mime = file.mimetype.toLowerCase();
    if (allowed.test(ext) || mime.startsWith('image/') || mime.startsWith('video/')) {
      return cb(null, true);
    }
    cb(new Error('Tipe berkas tidak didukung. Harap unggah gambar atau video yang valid.'));
  }
});

// GET /api/media (public or authenticated)
router.get('/', (req, res) => {
  try {
    const { category, search, limit = 100, page = 1 } = req.query;
    let query = 'SELECT * FROM media_assets WHERE 1=1';
    const params = [];

    if (category && category !== 'all') {
      query += ' AND category = ?';
      params.push(category);
    }

    if (search) {
      query += ' AND (original_name LIKE ? OR alt_text LIKE ? OR description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(Number(limit), (Number(page) - 1) * Number(limit));

    const assets = db.prepare(query).all(...params);
    const totalCount = db.prepare('SELECT COUNT(*) as count FROM media_assets').get().count;

    res.json({ assets, totalCount });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/media/upload (admin only)
router.post('/upload', authenticateToken, upload.array('files', 15), (req, res) => {
  try {
    const files = req.files;
    const category = req.body.category || 'general';

    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'Tidak ada berkas yang diunggah.' });
    }

    const insertStmt = db.prepare(`
      INSERT INTO media_assets (
        filename, original_name, mime_type, file_size, category, url, alt_text, description
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertedAssets = [];

    const insertMany = db.transaction((filesList) => {
      for (const file of filesList) {
        const fileUrl = `/uploads/${file.filename}`;
        const altText = req.body.alt_text || path.basename(file.originalname, path.extname(file.originalname));
        const result = insertStmt.run(
          file.filename,
          file.originalname,
          file.mimetype,
          file.size,
          category,
          fileUrl,
          altText,
          req.body.description || ''
        );
        insertedAssets.push({
          id: result.lastInsertRowid,
          filename: file.filename,
          original_name: file.originalname,
          mime_type: file.mimetype,
          file_size: file.size,
          category,
          url: fileUrl,
          alt_text: altText
        });
      }
    });

    insertMany(files);

    res.status(201).json({
      message: `${files.length} berkas berhasil diunggah.`,
      assets: insertedAssets
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/media/external (e.g. YouTube, Vimeo, or external image URL)
router.post('/external', authenticateToken, (req, res) => {
  try {
    const { url, title, category = 'video', alt_text = '', description = '' } = req.body;
    if (!url) {
      return res.status(400).json({ error: 'URL media eksternal wajib diisi.' });
    }

    const insertStmt = db.prepare(`
      INSERT INTO media_assets (
        filename, original_name, mime_type, file_size, category, url, alt_text, description
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const isVideo = url.includes('youtube') || url.includes('youtu.be') || url.includes('vimeo');
    const result = insertStmt.run(
      url,
      title || 'External Media',
      isVideo ? 'video/external' : 'image/external',
      0,
      category,
      url,
      alt_text || title || 'External Media',
      description
    );

    res.status(201).json({
      message: 'Media eksternal berhasil ditambahkan.',
      asset: {
        id: result.lastInsertRowid,
        url,
        original_name: title,
        category
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/media/:id (update alt text, title, category)
router.put('/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const { alt_text, description, category, original_name } = req.body;

    db.prepare(`
      UPDATE media_assets
      SET alt_text = COALESCE(?, alt_text),
          description = COALESCE(?, description),
          category = COALESCE(?, category),
          original_name = COALESCE(?, original_name)
      WHERE id = ?
    `).run(alt_text, description, category, original_name, id);

    const updated = db.prepare('SELECT * FROM media_assets WHERE id = ?').get(id);
    res.json({ message: 'Informasi media berhasil diperbarui.', asset: updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/media/usage-check/:id
router.get('/usage-check/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const asset = db.prepare('SELECT * FROM media_assets WHERE id = ?').get(id);
    if (!asset) {
      return res.status(404).json({ error: 'Berkas media tidak ditemukan.' });
    }

    const usages = [];

    // Check in site_settings
    const settings = db.prepare('SELECT key, value FROM site_settings WHERE value = ?').all(asset.url);
    if (settings.length > 0) {
      usages.push({ type: 'Site Settings', details: settings.map(s => s.key).join(', ') });
    }

    // Check in website_sections
    const sections = db.prepare('SELECT section_key, title FROM website_sections WHERE background_media_url = ?').all(asset.url);
    if (sections.length > 0) {
      usages.push({ type: 'Page Sections', details: sections.map(s => s.title || s.section_key).join(', ') });
    }

    // Check in portfolio_projects
    const projects = db.prepare('SELECT id, title FROM portfolio_projects WHERE cover_image_url = ?').all(asset.url);
    if (projects.length > 0) {
      usages.push({ type: 'Portfolio Covers', details: projects.map(p => p.title).join(', ') });
    }

    // Check in portfolio_images
    const projectImages = db.prepare(`
      SELECT p.title FROM portfolio_images pi
      JOIN portfolio_projects p ON pi.project_id = p.id
      WHERE pi.image_url = ?
    `).all(asset.url);
    if (projectImages.length > 0) {
      usages.push({ type: 'Portfolio Gallery Images', details: projectImages.map(p => p.title).join(', ') });
    }

    // Check in services
    const services = db.prepare('SELECT name FROM services WHERE cover_image_url = ?').all(asset.url);
    if (services.length > 0) {
      usages.push({ type: 'Services', details: services.map(s => s.name).join(', ') });
    }

    res.json({
      inUse: usages.length > 0,
      usages
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/media/:id
router.delete('/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const asset = db.prepare('SELECT * FROM media_assets WHERE id = ?').get(id);

    if (!asset) {
      return res.status(404).json({ error: 'Berkas tidak ditemukan.' });
    }

    // If local file, delete from disk
    if (asset.filename && !asset.url.startsWith('http')) {
      const filePath = path.join(uploadsDir, asset.filename);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (e) {
          console.error('[Media] Gagal menghapus file fisik:', e);
        }
      }
    }

    db.prepare('DELETE FROM media_assets WHERE id = ?').run(id);
    res.json({ message: 'Berkas media berhasil dihapus.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
