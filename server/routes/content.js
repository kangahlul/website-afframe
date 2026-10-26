const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { authenticateToken } = require('../middleware/auth');

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
}

// ==========================================
// FAQ ITEMS
// ==========================================

// GET /api/content/faqs (public & admin)
router.get('/faqs', async (req, res) => {
  try {
    const { all } = req.query;
    let query = 'SELECT * FROM faq_items';
    if (!all) {
      query += ' WHERE is_published = 1';
    }
    query += ' ORDER BY sort_order ASC, id ASC';
    const faqs = await db.prepare(query).all();
    res.json({ faqs });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/content/faqs (admin)
router.post('/faqs', authenticateToken, async (req, res) => {
  try {
    const { question, answer, category = 'general', sort_order } = req.body;
    if (!question || !answer) {
      return res.status(400).json({ error: 'Pertanyaan dan jawaban wajib diisi.' });
    }

    const maxOrder = await db.prepare('SELECT MAX(sort_order) as m FROM faq_items').get();
    const nextOrder = sort_order !== undefined ? sort_order : (maxOrder?.m || 0) + 1;

    const result = await db.prepare(`
      INSERT INTO faq_items (question, answer, category, is_published, sort_order)
      VALUES (?, ?, ?, 1, ?)
    `).run(question, answer, category, nextOrder);

    const created = await db.prepare('SELECT * FROM faq_items WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ message: 'FAQ berhasil ditambahkan.', faq: created });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/content/faqs/:id (admin)
router.put('/faqs/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { question, answer, category, is_published, sort_order } = req.body;

    await db.prepare(`
      UPDATE faq_items
      SET question = COALESCE(?, question),
          answer = COALESCE(?, answer),
          category = COALESCE(?, category),
          is_published = COALESCE(?, is_published),
          sort_order = COALESCE(?, sort_order),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(question, answer, category, is_published, sort_order, id);

    const updated = await db.prepare('SELECT * FROM faq_items WHERE id = ?').get(id);
    res.json({ message: 'FAQ berhasil diperbarui.', faq: updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/content/faqs/:id (admin)
router.delete('/faqs/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    await db.prepare('DELETE FROM faq_items WHERE id = ?').run(id);
    res.json({ message: 'FAQ berhasil dihapus.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// BENEFITS (Kenapa Kami)
// ==========================================

// GET /api/content/benefits (public & admin)
router.get('/benefits', async (req, res) => {
  try {
    const { all } = req.query;
    let query = 'SELECT * FROM benefits';
    if (!all) {
      query += ' WHERE is_visible = 1';
    }
    query += ' ORDER BY sort_order ASC, id ASC';
    const benefits = await db.prepare(query).all();
    res.json({ benefits });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/content/benefits (admin)
router.post('/benefits', authenticateToken, async (req, res) => {
  try {
    const { title, description, icon_name = 'Sparkles', image_url = '', sort_order } = req.body;
    if (!title || !description) {
      return res.status(400).json({ error: 'Judul dan deskripsi keunggulan wajib diisi.' });
    }

    const maxOrder = await db.prepare('SELECT MAX(sort_order) as m FROM benefits').get();
    const nextOrder = sort_order !== undefined ? sort_order : (maxOrder?.m || 0) + 1;

    const result = await db.prepare(`
      INSERT INTO benefits (title, description, icon_name, image_url, is_visible, sort_order)
      VALUES (?, ?, ?, ?, 1, ?)
    `).run(title, description, icon_name, image_url, nextOrder);

    const created = await db.prepare('SELECT * FROM benefits WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ message: 'Keunggulan berhasil ditambahkan.', benefit: created });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/content/benefits/:id (admin)
router.put('/benefits/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, icon_name, image_url, is_visible, sort_order } = req.body;

    await db.prepare(`
      UPDATE benefits
      SET title = COALESCE(?, title),
          description = COALESCE(?, description),
          icon_name = COALESCE(?, icon_name),
          image_url = COALESCE(?, image_url),
          is_visible = COALESCE(?, is_visible),
          sort_order = COALESCE(?, sort_order),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(title, description, icon_name, image_url, is_visible, sort_order, id);

    const updated = await db.prepare('SELECT * FROM benefits WHERE id = ?').get(id);
    res.json({ message: 'Keunggulan berhasil diperbarui.', benefit: updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/content/benefits/:id (admin)
router.delete('/benefits/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    await db.prepare('DELETE FROM benefits WHERE id = ?').run(id);
    res.json({ message: 'Keunggulan berhasil dihapus.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// TERMS & CONDITIONS (Syarat & Ketentuan)
// ==========================================

// GET /api/content/terms (public & admin)
router.get('/terms', async (req, res) => {
  try {
    const { all } = req.query;
    let query = 'SELECT * FROM terms_content';
    if (!all) {
      query += ' WHERE is_published = 1';
    }
    query += ' ORDER BY clause_number ASC, sort_order ASC, id ASC';
    const terms = await db.prepare(query).all();
    res.json({ terms });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/content/terms (admin)
router.post('/terms', authenticateToken, async (req, res) => {
  try {
    const { title, clause_number, clause_text, sort_order } = req.body;
    if (!title || !clause_text) {
      return res.status(400).json({ error: 'Judul pasal dan isi klausul wajib diisi.' });
    }

    const maxClause = await db.prepare('SELECT MAX(clause_number) as m FROM terms_content').get();
    const nextClause = clause_number !== undefined ? clause_number : (maxClause?.m || 0) + 1;

    const result = await db.prepare(`
      INSERT INTO terms_content (title, clause_number, clause_text, is_published, sort_order)
      VALUES (?, ?, ?, 1, ?)
    `).run(title, nextClause, clause_text, sort_order || nextClause);

    const created = await db.prepare('SELECT * FROM terms_content WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ message: 'Pasal ketentuan berhasil ditambahkan.', term: created });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/content/terms/:id (admin)
router.put('/terms/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, clause_number, clause_text, is_published, sort_order } = req.body;

    await db.prepare(`
      UPDATE terms_content
      SET title = COALESCE(?, title),
          clause_number = COALESCE(?, clause_number),
          clause_text = COALESCE(?, clause_text),
          is_published = COALESCE(?, is_published),
          sort_order = COALESCE(?, sort_order),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(title, clause_number, clause_text, is_published, sort_order, id);

    const updated = await db.prepare('SELECT * FROM terms_content WHERE id = ?').get(id);
    res.json({ message: 'Pasal ketentuan berhasil diperbarui.', term: updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/content/terms/:id (admin)
router.delete('/terms/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    await db.prepare('DELETE FROM terms_content WHERE id = ?').run(id);
    res.json({ message: 'Pasal ketentuan berhasil dihapus.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// SERVICE AREAS
// ==========================================

// GET /api/content/service-areas (public & admin)
router.get('/service-areas', async (req, res) => {
  try {
    const { all } = req.query;
    let query = 'SELECT * FROM service_areas';
    if (!all) {
      query += ' WHERE is_visible = 1';
    }
    query += ' ORDER BY sort_order ASC, id ASC';
    const areas = await db.prepare(query).all();
    res.json({ areas });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/content/service-areas (admin)
router.post('/service-areas', authenticateToken, async (req, res) => {
  try {
    const { name, description, image_url = '', is_primary = 1, sort_order } = req.body;
    if (!name || !description) {
      return res.status(400).json({ error: 'Nama wilayah dan deskripsi wajib diisi.' });
    }

    const maxOrder = await db.prepare('SELECT MAX(sort_order) as m FROM service_areas').get();
    const nextOrder = sort_order !== undefined ? sort_order : (maxOrder?.m || 0) + 1;

    const result = await db.prepare(`
      INSERT INTO service_areas (name, description, image_url, is_primary, is_visible, sort_order)
      VALUES (?, ?, ?, ?, 1, ?)
    `).run(name, description, image_url, is_primary ? 1 : 0, nextOrder);

    const created = await db.prepare('SELECT * FROM service_areas WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ message: 'Wilayah layanan berhasil ditambahkan.', area: created });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/content/service-areas/:id (admin)
router.put('/service-areas/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, image_url, is_primary, is_visible, sort_order } = req.body;

    await db.prepare(`
      UPDATE service_areas
      SET name = COALESCE(?, name),
          description = COALESCE(?, description),
          image_url = COALESCE(?, image_url),
          is_primary = COALESCE(?, is_primary),
          is_visible = COALESCE(?, is_visible),
          sort_order = COALESCE(?, sort_order),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(name, description, image_url, is_primary, is_visible, sort_order, id);

    const updated = await db.prepare('SELECT * FROM service_areas WHERE id = ?').get(id);
    res.json({ message: 'Wilayah layanan berhasil diperbarui.', area: updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/content/service-areas/:id (admin)
router.delete('/service-areas/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    await db.prepare('DELETE FROM service_areas WHERE id = ?').run(id);
    res.json({ message: 'Wilayah layanan berhasil dihapus.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// NAVIGATION ITEMS
// ==========================================

// GET /api/content/navigation (public & admin)
router.get('/navigation', async (req, res) => {
  try {
    const { all, location } = req.query;
    let query = 'SELECT * FROM navigation_items WHERE 1=1';
    const params = [];

    if (!all) {
      query += ' AND is_visible = 1';
    }
    if (location) {
      query += ' AND location = ?';
      params.push(location);
    }
    query += ' ORDER BY sort_order ASC, id ASC';

    const items = await db.prepare(query).all(...params);
    res.json({ items });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/content/navigation (admin)
router.post('/navigation', authenticateToken, async (req, res) => {
  try {
    const { label, url, target = '_self', location = 'header', sort_order } = req.body;
    if (!label || !url) {
      return res.status(400).json({ error: 'Label dan URL tautan wajib diisi.' });
    }

    const maxOrder = await db.prepare('SELECT MAX(sort_order) as m FROM navigation_items WHERE location = ?').get(location);
    const nextOrder = sort_order !== undefined ? sort_order : (maxOrder?.m || 0) + 1;

    const result = await db.prepare(`
      INSERT INTO navigation_items (label, url, target, location, is_visible, sort_order)
      VALUES (?, ?, ?, ?, 1, ?)
    `).run(label, url, target, location, nextOrder);

    const created = await db.prepare('SELECT * FROM navigation_items WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ message: 'Tautan menu berhasil ditambahkan.', item: created });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/content/navigation/:id (admin)
router.put('/navigation/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { label, url, target, location, is_visible, sort_order } = req.body;

    await db.prepare(`
      UPDATE navigation_items
      SET label = COALESCE(?, label),
          url = COALESCE(?, url),
          target = COALESCE(?, target),
          location = COALESCE(?, location),
          is_visible = COALESCE(?, is_visible),
          sort_order = COALESCE(?, sort_order),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(label, url, target, location, is_visible, sort_order, id);

    const updated = await db.prepare('SELECT * FROM navigation_items WHERE id = ?').get(id);
    res.json({ message: 'Tautan menu berhasil diperbarui.', item: updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/content/navigation/:id (admin)
router.delete('/navigation/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    await db.prepare('DELETE FROM navigation_items WHERE id = ?').run(id);
    res.json({ message: 'Tautan menu berhasil dihapus.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// DYNAMIC PAGES (website_pages)
// ==========================================

// GET /api/content/pages (public & admin)
router.get('/pages', async (req, res) => {
  try {
    const { all } = req.query;
    let query = 'SELECT * FROM website_pages';
    if (!all) {
      query += ' WHERE is_published = 1';
    }
    query += ' ORDER BY sort_order ASC, id ASC';
    const pages = await db.prepare(query).all();
    res.json({ pages });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/content/pages/:slug (public)
router.get('/pages/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const page = await db.prepare('SELECT * FROM website_pages WHERE slug = ?').get(slug);
    if (!page) {
      return res.status(404).json({ error: 'Halaman tidak ditemukan.' });
    }
    res.json({ page });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/content/pages (admin)
router.post('/pages', authenticateToken, async (req, res) => {
  try {
    const { title, slug, description, content_json, seo_title, seo_description, og_image_url, sort_order } = req.body;
    if (!title) {
      return res.status(400).json({ error: 'Judul halaman wajib diisi.' });
    }

    const finalSlug = slug ? slugify(slug) : slugify(title);
    const existing = await db.prepare('SELECT id FROM website_pages WHERE slug = ?').get(finalSlug);
    if (existing) {
      return res.status(400).json({ error: 'Slug URL halaman sudah digunakan. Silakan gunakan slug lain.' });
    }

    const maxOrder = await db.prepare('SELECT MAX(sort_order) as m FROM website_pages').get();
    const nextOrder = sort_order !== undefined ? sort_order : (maxOrder?.m || 0) + 1;

    const result = await db.prepare(`
      INSERT INTO website_pages (
        title, slug, description, content_json, seo_title, seo_description, og_image_url, is_published, sort_order
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)
    `).run(
      title, finalSlug, description || '',
      content_json || '{}',
      seo_title || title,
      seo_description || description || '',
      og_image_url || '',
      nextOrder
    );

    const created = await db.prepare('SELECT * FROM website_pages WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ message: 'Halaman berhasil dibuat.', page: created });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/content/pages/:id (admin)
router.put('/pages/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, slug, description, content_json, seo_title, seo_description, og_image_url, is_published, sort_order } = req.body;

    const current = await db.prepare('SELECT * FROM website_pages WHERE id = ?').get(id);
    if (!current) {
      return res.status(404).json({ error: 'Halaman tidak ditemukan.' });
    }

    let finalSlug = slug ? slugify(slug) : current.slug;
    if (slug && slug !== current.slug) {
      const existing = await db.prepare('SELECT id FROM website_pages WHERE slug = ? AND id != ?').get(finalSlug, id);
      if (existing) {
        return res.status(400).json({ error: 'Slug URL sudah digunakan oleh halaman lain.' });
      }
    }

    await db.prepare(`
      UPDATE website_pages
      SET title = COALESCE(?, title),
          slug = ?,
          description = COALESCE(?, description),
          content_json = COALESCE(?, content_json),
          seo_title = COALESCE(?, seo_title),
          seo_description = COALESCE(?, seo_description),
          og_image_url = COALESCE(?, og_image_url),
          is_published = COALESCE(?, is_published),
          sort_order = COALESCE(?, sort_order),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      title, finalSlug, description, content_json,
      seo_title, seo_description, og_image_url,
      is_published, sort_order, id
    );

    const updated = await db.prepare('SELECT * FROM website_pages WHERE id = ?').get(id);
    res.json({ message: 'Halaman berhasil diperbarui.', page: updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/content/pages/:id (admin)
router.delete('/pages/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    await db.prepare('DELETE FROM website_pages WHERE id = ?').run(id);
    res.json({ message: 'Halaman berhasil dihapus.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
