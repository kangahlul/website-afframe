const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { authenticateToken } = require('../middleware/auth');

// GET /api/sections - List sections
router.get('/', async (req, res) => {
  try {
    const { all } = req.query;
    let query = 'SELECT * FROM website_sections';
    if (!all) {
      query += ' WHERE is_visible = 1';
    }
    query += ' ORDER BY sort_order ASC, id ASC';

    const sections = await db.prepare(query).all();
    res.json({ sections });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/sections/:key
router.get('/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const section = await db.prepare('SELECT * FROM website_sections WHERE section_key = ?').get(key);
    if (!section) {
      return res.status(404).json({ error: 'Section tidak ditemukan.' });
    }
    res.json({ section });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/sections/:id - Update section
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title, subtitle, description,
      cta_primary_text, cta_primary_url,
      cta_secondary_text, cta_secondary_url,
      background_media_url, background_type,
      overlay_opacity, focal_point, text_alignment,
      theme, is_visible, sort_order
    } = req.body;

    await db.prepare(`
      UPDATE website_sections
      SET title = COALESCE(?, title),
          subtitle = COALESCE(?, subtitle),
          description = COALESCE(?, description),
          cta_primary_text = COALESCE(?, cta_primary_text),
          cta_primary_url = COALESCE(?, cta_primary_url),
          cta_secondary_text = COALESCE(?, cta_secondary_text),
          cta_secondary_url = COALESCE(?, cta_secondary_url),
          background_media_url = COALESCE(?, background_media_url),
          background_type = COALESCE(?, background_type),
          overlay_opacity = COALESCE(?, overlay_opacity),
          focal_point = COALESCE(?, focal_point),
          text_alignment = COALESCE(?, text_alignment),
          theme = COALESCE(?, theme),
          is_visible = COALESCE(?, is_visible),
          sort_order = COALESCE(?, sort_order),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      title, subtitle, description,
      cta_primary_text, cta_primary_url,
      cta_secondary_text, cta_secondary_url,
      background_media_url, background_type,
      overlay_opacity, focal_point, text_alignment,
      theme, is_visible, sort_order, id
    );

    const updated = await db.prepare('SELECT * FROM website_sections WHERE id = ?').get(id);
    res.json({ message: 'Section berhasil diperbarui.', section: updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/sections/reorder - Batch update section order
router.post('/reorder', authenticateToken, async (req, res) => {
  try {
    const { items } = req.body; // array of { id, sort_order, is_visible }
    if (!Array.isArray(items)) {
      return res.status(400).json({ error: 'Data urutan section tidak valid.' });
    }

    const updateStmt = db.prepare(`
      UPDATE website_sections
      SET sort_order = ?, is_visible = COALESCE(?, is_visible), updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    for (const item of items) {
      await updateStmt.run(item.sort_order, item.is_visible !== undefined ? (item.is_visible ? 1 : 0) : null, item.id);
    }

    const sections = await db.prepare('SELECT * FROM website_sections ORDER BY sort_order ASC').all();
    res.json({ message: 'Urutan section berhasil diperbarui.', sections });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/sections - Add custom reusable section
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      section_key, title, subtitle, description,
      cta_primary_text, cta_primary_url,
      background_media_url, background_type,
      overlay_opacity, text_alignment, theme, sort_order
    } = req.body;

    if (!section_key || !title) {
      return res.status(400).json({ error: 'Section key dan judul wajib diisi.' });
    }

    const maxOrder = await db.prepare('SELECT MAX(sort_order) as maxOrder FROM website_sections').get();
    const nextOrder = sort_order !== undefined ? sort_order : (maxOrder?.maxOrder || 0) + 1;

    const result = await db.prepare(`
      INSERT INTO website_sections (
        section_key, title, subtitle, description,
        cta_primary_text, cta_primary_url,
        background_media_url, background_type,
        overlay_opacity, text_alignment, theme, is_visible, sort_order
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
    `).run(
      section_key, title, subtitle || '', description || '',
      cta_primary_text || '', cta_primary_url || '',
      background_media_url || '', background_type || 'none',
      overlay_opacity || 50, text_alignment || 'left', theme || 'dark', nextOrder
    );

    const created = await db.prepare('SELECT * FROM website_sections WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ message: 'Section baru berhasil ditambahkan.', section: created });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/sections/:id
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const section = await db.prepare('SELECT * FROM website_sections WHERE id = ?').get(id);
    if (!section) {
      return res.status(404).json({ error: 'Section tidak ditemukan.' });
    }

    // Protect core sections from accidental deletion
    const protectedKeys = ['hero', 'selected_works', 'packages', 'booking_cta'];
    if (protectedKeys.includes(section.section_key)) {
      return res.status(400).json({
        error: `Section "${section.section_key}" adalah komponen inti website dan tidak boleh dihapus. Anda dapat menyembunyikannya melalui tombol saklar visibilitas.`
      });
    }

    await db.prepare('DELETE FROM website_sections WHERE id = ?').run(id);
    res.json({ message: 'Section berhasil dihapus.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
