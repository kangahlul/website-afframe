const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const https = require('https');
const { db } = require('../db');
const { authenticateToken } = require('../middleware/auth');

function normalizeMediaUrl(url) {
  if (!url) return '';
  const trimmed = url.trim();
  if (trimmed.includes('drive.google.com/file/d/')) {
    const match = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      return `https://drive.google.com/thumbnail?id=${match[1]}&sz=w1920`;
    }
  }
  if (trimmed.includes('drive.google.com/open?id=')) {
    const match = trimmed.match(/id=([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      return `https://drive.google.com/thumbnail?id=${match[1]}&sz=w1920`;
    }
  }
  return trimmed;
}

const isVercel = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
const uploadsDir = isVercel ? path.join('/tmp', 'uploads') : path.join(__dirname, '../uploads');
try {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
} catch (e) {
  console.warn('[Uploads Directory]', e.message);
}

// Memory storage for serverless edge compatibility (saves as permanent data URIs)
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB limit
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
router.get('/', async (req, res) => {
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

    const assets = await db.prepare(query).all(...params);
    const totalCount = (await db.prepare('SELECT COUNT(*) as count FROM media_assets').get())?.count || 0;

    res.json({ assets, totalCount });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/media/upload (admin only - handles files and saves as persistent data URIs)
router.post('/upload', authenticateToken, upload.array('files', 15), async (req, res) => {
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

    for (const file of files) {
      const ext = path.extname(file.originalname);
      const safeName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
      const uniqueFilename = `${safeName}-${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`;

      // Convert to Base64 Data URI for 100% persistent cloud storage
      const base64Data = file.buffer.toString('base64');
      const fileUrl = `data:${file.mimetype};base64,${base64Data}`;
      const altText = req.body.alt_text || path.basename(file.originalname, ext);

      // Also persist to local disk if running in persistent environment
      try {
        if (fs.existsSync(uploadsDir)) {
          fs.writeFileSync(path.join(uploadsDir, uniqueFilename), file.buffer);
        }
      } catch (fsErr) {
        // Non-blocking in serverless environments
      }

      const result = await insertStmt.run(
        uniqueFilename,
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
        filename: uniqueFilename,
        original_name: file.originalname,
        mime_type: file.mimetype,
        file_size: file.size,
        category,
        url: fileUrl,
        alt_text: altText
      });
    }

    res.status(201).json({
      message: `${files.length} berkas berhasil diunggah dan disimpan secara permanen.`,
      assets: insertedAssets
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/media/external (e.g. YouTube, Vimeo, Google Drive, or any external image/video URL)
router.post('/external', authenticateToken, async (req, res) => {
  try {
    const { url, title, category = 'general', alt_text = '', description = '' } = req.body;
    if (!url) {
      return res.status(400).json({ error: 'URL media eksternal wajib diisi.' });
    }

    const cleanUrl = normalizeMediaUrl(url);

    const isVideo = cleanUrl.includes('youtube') || cleanUrl.includes('youtu.be') || cleanUrl.includes('vimeo') || cleanUrl.endsWith('.mp4') || cleanUrl.endsWith('.webm') || cleanUrl.endsWith('.mov');
    const detectedCategory = category !== 'general' ? category : (isVideo ? 'video' : 'general');
    const detectedMime = isVideo ? 'video/external' : 'image/external';

    const insertStmt = db.prepare(`
      INSERT INTO media_assets (
        filename, original_name, mime_type, file_size, category, url, alt_text, description
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = await insertStmt.run(
      cleanUrl,
      title || (isVideo ? 'External Video' : 'External Image'),
      detectedMime,
      0,
      detectedCategory,
      cleanUrl,
      alt_text || title || 'External Media',
      description
    );

    res.status(201).json({
      message: 'Media eksternal berhasil ditambahkan.',
      asset: {
        id: result.lastInsertRowid,
        url: cleanUrl,
        original_name: title || 'External Media',
        category: detectedCategory
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/media/:id (update alt text, title, category, and url)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { alt_text, description, category, original_name, url } = req.body;
    const cleanUrl = url ? normalizeMediaUrl(url) : undefined;

    await db.prepare(`
      UPDATE media_assets
      SET alt_text = COALESCE(?, alt_text),
          description = COALESCE(?, description),
          category = COALESCE(?, category),
          original_name = COALESCE(?, original_name),
          url = COALESCE(?, url)
      WHERE id = ?
    `).run(alt_text, description, category, original_name, cleanUrl, id);

    const updated = await db.prepare('SELECT * FROM media_assets WHERE id = ?').get(id);
    res.json({ message: 'Informasi media berhasil diperbarui.', asset: updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/media/usage-check/:id
router.get('/usage-check/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const asset = await db.prepare('SELECT * FROM media_assets WHERE id = ?').get(id);
    if (!asset) {
      return res.status(404).json({ error: 'Berkas media tidak ditemukan.' });
    }

    const usages = [];

    // Check in site_settings
    const settings = await db.prepare('SELECT key, value FROM site_settings WHERE value = ?').all(asset.url);
    if (settings.length > 0) {
      usages.push({ type: 'Site Settings', details: settings.map(s => s.key).join(', ') });
    }

    // Check in website_sections
    const sections = await db.prepare('SELECT section_key, title FROM website_sections WHERE background_media_url = ?').all(asset.url);
    if (sections.length > 0) {
      usages.push({ type: 'Page Sections', details: sections.map(s => s.title || s.section_key).join(', ') });
    }

    // Check in portfolio_projects
    const projects = await db.prepare('SELECT id, title FROM portfolio_projects WHERE cover_image_url = ?').all(asset.url);
    if (projects.length > 0) {
      usages.push({ type: 'Portfolio Covers', details: projects.map(p => p.title).join(', ') });
    }

    // Check in portfolio_images
    const projectImages = await db.prepare(`
      SELECT p.title FROM portfolio_images pi
      JOIN portfolio_projects p ON pi.project_id = p.id
      WHERE pi.image_url = ?
    `).all(asset.url);
    if (projectImages.length > 0) {
      usages.push({ type: 'Portfolio Gallery Images', details: projectImages.map(p => p.title).join(', ') });
    }

    // Check in services
    const services = await db.prepare('SELECT name FROM services WHERE cover_image_url = ?').all(asset.url);
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
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const asset = await db.prepare('SELECT * FROM media_assets WHERE id = ?').get(id);

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

    await db.prepare('DELETE FROM media_assets WHERE id = ?').run(id);
    res.json({ message: 'Berkas media berhasil dihapus.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/media/stream-drive?id=FILE_ID
// Redirect to Google Drive direct download — browser streams natively without Vercel proxy overhead
router.get('/stream-drive', (req, res) => {
  const fileId = req.query.id;
  if (!fileId || typeof fileId !== 'string') {
    return res.status(400).json({ error: 'Parameter id berkas diperlukan.' });
  }

  const cleanId = fileId.replace(/[^a-zA-Z0-9_-]/g, '');
  if (!cleanId) {
    return res.status(400).json({ error: 'ID berkas tidak valid.' });
  }

  // Redirect browser directly to Google Drive — no Vercel proxy bandwidth usage.
  // Google Drive sets Access-Control-Allow-Origin: * and supports Range requests (HTTP 206).
  const directUrl = `https://drive.usercontent.google.com/download?id=${cleanId}&export=download&authuser=0`;
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.setHeader('Access-Control-Allow-Origin', '*');
  return res.redirect(302, directUrl);
});

module.exports = router;
