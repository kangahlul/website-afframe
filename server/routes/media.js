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

// Persistent HTTPS agent with keep-alive to reuse TLS connections to Google Drive CDN
const streamAgent = new https.Agent({
  keepAlive: true,
  maxSockets: 50,
  maxFreeSockets: 10,
  timeout: 60000,
});

// Local video cache directory on disk
const videoCacheDir = isVercel ? path.join('/tmp', 'video_cache') : path.join(__dirname, '../video_cache');
try {
  if (!fs.existsSync(videoCacheDir)) {
    fs.mkdirSync(videoCacheDir, { recursive: true });
  }
} catch (_) {}

// In-memory cache for resolved Google Drive download endpoints (TTL: 2 hours)
const driveResolvedCache = new Map();
const activeDownloads = new Set();

function startBackgroundDownload(cleanId) {
  if (!cleanId || activeDownloads.has(cleanId)) return;
  const targetFile = path.join(videoCacheDir, `${cleanId}.mp4`);
  const partFile = path.join(videoCacheDir, `${cleanId}.part`);

  if (fs.existsSync(targetFile)) {
    try {
      if (fs.statSync(targetFile).size > 100000) return;
    } catch (_) {}
  }

  activeDownloads.add(cleanId);
  const targetUrl = `https://drive.usercontent.google.com/download?id=${cleanId}&export=download&authuser=0&confirm=t`;

  const fileStream = fs.createWriteStream(partFile);
  const req = https.get(targetUrl, {
    agent: streamAgent,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': '*/*'
    }
  }, (res) => {
    // If redirect:
    if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
      res.resume();
      https.get(res.headers.location, { agent: streamAgent }, (res2) => {
        if (res2.statusCode === 200) {
          res2.pipe(fileStream);
          fileStream.on('finish', () => {
            fileStream.close();
            try {
              if (fs.existsSync(partFile) && fs.statSync(partFile).size > 100000) {
                fs.renameSync(partFile, targetFile);
                console.log(`[Video Cache] Cached ${cleanId}.mp4 (${(fs.statSync(targetFile).size / 1024 / 1024).toFixed(1)}MB)`);
              }
            } catch (_) {}
            activeDownloads.delete(cleanId);
          });
        } else {
          fileStream.close();
          activeDownloads.delete(cleanId);
        }
      });
      return;
    }

    if (res.statusCode === 200) {
      res.pipe(fileStream);
      fileStream.on('finish', () => {
        fileStream.close();
        try {
          if (fs.existsSync(partFile) && fs.statSync(partFile).size > 100000) {
            fs.renameSync(partFile, targetFile);
            console.log(`[Video Cache] Cached ${cleanId}.mp4 (${(fs.statSync(targetFile).size / 1024 / 1024).toFixed(1)}MB)`);
          }
        } catch (_) {}
        activeDownloads.delete(cleanId);
      });
    } else {
      fileStream.close();
      activeDownloads.delete(cleanId);
    }
  });

  req.on('error', () => {
    try { fileStream.close(); } catch (_) {}
    activeDownloads.delete(cleanId);
  });
}

function serveLocalVideoFile(req, res, filePath, cleanId) {
  try {
    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Range, Content-Type');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    if (cleanId) res.setHeader('ETag', `"${cleanId}"`);

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunkSize = (end - start) + 1;

      res.statusCode = 206;
      res.setHeader('Content-Range', `bytes ${start}-${end}/${fileSize}`);
      res.setHeader('Content-Length', chunkSize);

      const stream = fs.createReadStream(filePath, { start, end });
      stream.pipe(res);
      req.on('close', () => {
        try { stream.destroy(); } catch (_) {}
      });
    } else {
      res.statusCode = 200;
      res.setHeader('Content-Length', fileSize);
      const stream = fs.createReadStream(filePath);
      stream.pipe(res);
      req.on('close', () => {
        try { stream.destroy(); } catch (_) {}
      });
    }
  } catch (err) {
    console.error('[Local Video Serve Error]', err.message);
  }
}

function prewarmDriveVideo(fileId) {
  if (!fileId || typeof fileId !== 'string') return;
  const cleanId = fileId.replace(/[^a-zA-Z0-9_-]/g, '');
  if (!cleanId) return;
  startBackgroundDownload(cleanId);
}

function prewarmDriveVideos(fileIds = []) {
  if (!Array.isArray(fileIds)) return;
  let delay = 500;
  fileIds.forEach((id) => {
    setTimeout(() => {
      prewarmDriveVideo(id);
    }, delay);
    delay += 2500; // stagger 2.5s apart to prevent network saturation
  });
}

// GET /api/media/stream-drive?id=FILE_ID
// Proxy Google Drive video dengan Range requests & CORS — clean HTML5 player tanpa UI Google Drive
router.get('/stream-drive', (req, res) => {
  const fileId = req.query.id;
  if (!fileId || typeof fileId !== 'string') {
    return res.status(400).json({ error: 'Parameter id berkas diperlukan.' });
  }

  const cleanId = fileId.replace(/[^a-zA-Z0-9_-]/g, '');
  if (!cleanId) return res.status(400).json({ error: 'ID tidak valid.' });

  // 1. Ultra Fast Path: serve from local disk cache if already downloaded
  const localCachedFile = path.join(videoCacheDir, `${cleanId}.mp4`);
  if (fs.existsSync(localCachedFile)) {
    try {
      const sz = fs.statSync(localCachedFile).size;
      if (sz > 100000) {
        return serveLocalVideoFile(req, res, localCachedFile, cleanId);
      }
    } catch (_) {}
  }

  // Not on disk yet: start background download so subsequent requests & loops are local!
  startBackgroundDownload(cleanId);

  // Direct confirm parameter immediately bypasses virus warning page
  const targetUrl = `https://drive.usercontent.google.com/download?id=${cleanId}&export=download&authuser=0&confirm=t`;

  const forwardHeaders = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': '*/*',
  };
  if (req.headers.range) forwardHeaders['Range'] = req.headers.range;

  let activeReq = null;
  req.on('close', () => {
    if (activeReq) {
      try { activeReq.destroy(); } catch (_) {}
    }
  });

  // Fast path: if resolved URL is already cached, stream directly with zero HTML overhead!
  const cached = driveResolvedCache.get(cleanId);
  if (cached && Date.now() < cached.expiresAt) {
    const fastHeaders = { ...forwardHeaders };
    if (cached.cookie) fastHeaders['Cookie'] = cached.cookie;
    activeReq = https.get(cached.url, { agent: streamAgent, headers: fastHeaders }, (driveRes) => {
      // Follow redirect if CDN rotated
      if (driveRes.statusCode >= 300 && driveRes.statusCode < 400 && driveRes.headers.location) {
        driveRes.resume();
        fetchUrl(driveRes.headers.location, fastHeaders);
        return;
      }
      if (driveRes.statusCode >= 200 && driveRes.statusCode < 300) {
        sendVideoResponse(req, res, driveRes, cleanId);
        return;
      }
      // If cached URL returned non-2xx (e.g. token expired), evict and resolve fresh
      driveResolvedCache.delete(cleanId);
      fetchUrl(targetUrl, forwardHeaders);
    });
    activeReq.on('error', () => {
      driveResolvedCache.delete(cleanId);
      fetchUrl(targetUrl, forwardHeaders);
    });
    return;
  }

  function fetchUrl(url, currentHeaders, redirectCount = 0) {
    if (redirectCount > 5) {
      if (!res.headersSent) res.status(502).json({ error: 'Terlalu banyak redirect.' });
      return;
    }

    activeReq = https.get(url, { agent: streamAgent, headers: currentHeaders }, (driveRes) => {
      const cookies = (driveRes.headers['set-cookie'] || []).map(c => c.split(';')[0]).join('; ');
      const newHeaders = { ...currentHeaders };
      if (cookies) {
        newHeaders['Cookie'] = currentHeaders['Cookie'] ? `${currentHeaders['Cookie']}; ${cookies}` : cookies;
      }

      // 1. Follow HTTP Redirects (301, 302, 303, 307, 308)
      if (driveRes.statusCode >= 300 && driveRes.statusCode < 400 && driveRes.headers.location) {
        driveRes.resume();
        fetchUrl(driveRes.headers.location, newHeaders, redirectCount + 1);
        return;
      }

      // 2. Check for Google Drive "Virus scan warning" HTML page (files > ~25MB/100MB)
      const isHtml = (driveRes.headers['content-type'] || '').includes('text/html');
      if (driveRes.statusCode === 200 && isHtml) {
        let html = '';
        driveRes.on('data', chunk => {
          if (html.length < 50000) html += chunk.toString();
        });
        driveRes.on('end', () => {
          const uuidMatch = html.match(/name=["']uuid["']\s+value=["']([^"']+)["']/i);
          const uuid = uuidMatch ? uuidMatch[1] : '';
          const confirmUrl = `https://drive.usercontent.google.com/download?id=${cleanId}&export=download&authuser=0&confirm=t${uuid ? '&uuid=' + uuid : ''}`;
          
          // Cache the confirmed URL for future instant streaming!
          driveResolvedCache.set(cleanId, {
            url: confirmUrl,
            cookie: newHeaders['Cookie'] || '',
            expiresAt: Date.now() + 1000 * 60 * 60 * 2 // 2 hours
          });

          fetchUrl(confirmUrl, newHeaders, redirectCount + 1);
        });
        return;
      }

      // Cache direct URL if it streamed without virus warning
      if (driveRes.statusCode >= 200 && driveRes.statusCode < 300) {
        driveResolvedCache.set(cleanId, {
          url,
          cookie: newHeaders['Cookie'] || '',
          expiresAt: Date.now() + 1000 * 60 * 60 * 2
        });
      }

      // 3. Valid video stream received
      sendVideoResponse(req, res, driveRes, cleanId);
    });

    activeReq.on('error', (err) => {
      console.error('[Drive Stream Error]', err.message);
      if (!res.headersSent) res.status(502).json({ error: 'Gagal streaming video.' });
    });
  }

  fetchUrl(targetUrl, forwardHeaders);
});

function sendVideoResponse(req, res, driveRes, cleanId) {
  const status = driveRes.statusCode === 206 ? 206 : 200;
  res.statusCode = status;
  res.setHeader('Content-Type', 'video/mp4');
  res.setHeader('Accept-Ranges', 'bytes');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Range, Content-Type');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('Cache-Control', 'public, max-age=604800, immutable');
  if (cleanId) res.setHeader('ETag', `"${cleanId}"`);
  if (driveRes.headers['content-range']) res.setHeader('Content-Range', driveRes.headers['content-range']);
  if (driveRes.headers['content-length']) res.setHeader('Content-Length', driveRes.headers['content-length']);
  driveRes.pipe(res);
  req.on('close', () => {
    try { driveRes.destroy(); } catch (_) {}
  });
}

module.exports = router;
module.exports.prewarmDriveVideo = prewarmDriveVideo;
module.exports.prewarmDriveVideos = prewarmDriveVideos;
