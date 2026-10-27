const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { authenticateToken } = require('../middleware/auth');

// Helper to generate clean slug
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
// PORTFOLIO CATEGORIES
// ==========================================

// GET /api/portfolio/categories (public)
router.get('/categories', async (req, res) => {
  try {
    const { all } = req.query;
    let query = `
      SELECT pc.*, COUNT(pp.id) as project_count
      FROM portfolio_categories pc
      LEFT JOIN portfolio_projects pp ON pp.category_id = pc.id AND pp.is_published = 1
    `;
    if (!all) {
      query += ' WHERE pc.is_visible = 1';
    }
    query += ' GROUP BY pc.id ORDER BY pc.sort_order ASC, pc.id ASC';

    const categories = await db.prepare(query).all();
    res.json({ categories });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/portfolio/categories (admin)
router.post('/categories', authenticateToken, async (req, res) => {
  try {
    const { name, slug, description, cover_image_url, thumbnail_url, sort_order } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Nama kategori wajib diisi.' });
    }

    const finalSlug = slug ? slugify(slug) : slugify(name);
    const maxOrder = await db.prepare('SELECT MAX(sort_order) as m FROM portfolio_categories').get();
    const nextOrder = sort_order !== undefined ? sort_order : (maxOrder?.m || 0) + 1;

    const result = await db.prepare(`
      INSERT INTO portfolio_categories (name, slug, description, cover_image_url, thumbnail_url, is_visible, sort_order)
      VALUES (?, ?, ?, ?, ?, 1, ?)
    `).run(name, finalSlug, description || '', cover_image_url || '', thumbnail_url || cover_image_url || '', nextOrder);

    const created = await db.prepare('SELECT * FROM portfolio_categories WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ message: 'Kategori berhasil dibuat.', category: created });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/portfolio/categories/:id (admin)
router.put('/categories/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, slug, description, cover_image_url, thumbnail_url, is_visible, sort_order } = req.body;

    const current = await db.prepare('SELECT * FROM portfolio_categories WHERE id = ?').get(id);
    if (!current) {
      return res.status(404).json({ error: 'Kategori tidak ditemukan.' });
    }

    const finalSlug = slug ? slugify(slug) : (name ? slugify(name) : current.slug);

    await db.prepare(`
      UPDATE portfolio_categories
      SET name = COALESCE(?, name),
          slug = ?,
          description = COALESCE(?, description),
          cover_image_url = COALESCE(?, cover_image_url),
          thumbnail_url = COALESCE(?, thumbnail_url),
          is_visible = COALESCE(?, is_visible),
          sort_order = COALESCE(?, sort_order),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(name, finalSlug, description, cover_image_url, thumbnail_url, is_visible, sort_order, id);

    const updated = await db.prepare('SELECT * FROM portfolio_categories WHERE id = ?').get(id);
    res.json({ message: 'Kategori berhasil diperbarui.', category: updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/portfolio/categories/:id (admin)
router.delete('/categories/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    await db.prepare('UPDATE portfolio_projects SET category_id = NULL WHERE category_id = ?').run(id);
    await db.prepare('DELETE FROM portfolio_categories WHERE id = ?').run(id);
    res.json({ message: 'Kategori berhasil dihapus. Proyek terkait telah dipindahkan ke tanpa kategori.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// PORTFOLIO PROJECTS
// ==========================================

// GET /api/portfolio/projects (public & admin)
router.get('/projects', async (req, res) => {
  try {
    const { category, featured, search, all, limit = 50, page = 1, media_type } = req.query;
    let query = `
      SELECT pp.*, pc.name as category_name, pc.slug as category_slug
      FROM portfolio_projects pp
      LEFT JOIN portfolio_categories pc ON pp.category_id = pc.id
      WHERE 1=1
    `;
    const params = [];

    if (!all) {
      query += ' AND pp.is_published = 1';
    }

    if (featured === '1' || featured === 'true') {
      query += ' AND pp.is_featured = 1';
    }

    if (media_type && media_type !== 'all') {
      query += ' AND pp.media_type = ?';
      params.push(media_type);
    }

    if (category && category !== 'all') {
      query += ' AND (pc.slug = ? OR pc.id = ?)';
      params.push(category, category);
    }

    if (search) {
      query += ' AND (pp.title LIKE ? OR pp.short_description LIKE ? OR pp.client_name LIKE ? OR pp.location LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY pp.is_featured DESC, pp.sort_order ASC, pp.created_at DESC LIMIT ? OFFSET ?';
    params.push(Number(limit), (Number(page) - 1) * Number(limit));

    const projects = await db.prepare(query).all(...params);

    // Attach gallery images to each project
    const getImages = db.prepare('SELECT id, image_url, caption, alt_text, sort_order FROM portfolio_images WHERE project_id = ? ORDER BY sort_order ASC');
    for (const p of projects) {
      p.images = await getImages.all(p.id);
    }

    const totalCount = (await db.prepare('SELECT COUNT(*) as count FROM portfolio_projects' + (!all ? ' WHERE is_published = 1' : '')).get())?.count || 0;

    res.json({ projects, totalCount });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/portfolio/projects/:slug (public detail)
router.get('/projects/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const project = await db.prepare(`
      SELECT pp.*, pc.name as category_name, pc.slug as category_slug
      FROM portfolio_projects pp
      LEFT JOIN portfolio_categories pc ON pp.category_id = pc.id
      WHERE pp.slug = ? OR pp.id = ?
    `).get(slug, slug);

    if (!project) {
      return res.status(404).json({ error: 'Proyek portofolio tidak ditemukan.' });
    }

    const images = await db.prepare(`
      SELECT id, image_url, caption, alt_text, sort_order
      FROM portfolio_images
      WHERE project_id = ?
      ORDER BY sort_order ASC
    `).all(project.id);

    project.images = images;

    // Get related projects from the same category
    const related = await db.prepare(`
      SELECT pp.id, pp.title, pp.slug, pp.cover_image_url, pp.short_description, pc.name as category_name
      FROM portfolio_projects pp
      LEFT JOIN portfolio_categories pc ON pp.category_id = pc.id
      WHERE pp.id != ? AND pp.is_published = 1 AND pp.category_id = ?
      LIMIT 3
    `).all(project.id, project.category_id);

    res.json({ project, related });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/portfolio/projects (admin create)
router.post('/projects', authenticateToken, async (req, res) => {
  try {
    const {
      category_id, title, slug, short_description, full_description,
      client_name, project_date, location, cover_image_url, featured_video_url,
      media_type, orientation,
      is_featured, is_published, sort_order, seo_title, seo_description,
      gallery_images
    } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Judul proyek wajib diisi.' });
    }

    let finalSlug = slug ? slugify(slug) : slugify(title);
    const existing = await db.prepare('SELECT id FROM portfolio_projects WHERE slug = ?').get(finalSlug);
    if (existing) {
      finalSlug = `${finalSlug}-${Date.now().toString().slice(-4)}`;
    }

    const maxOrder = await db.prepare('SELECT MAX(sort_order) as m FROM portfolio_projects').get();
    const nextOrder = sort_order !== undefined ? sort_order : (maxOrder?.m || 0) + 1;

    // Detect media_type and orientation if not explicitly provided
    const finalMediaType = media_type || (featured_video_url && featured_video_url.trim() ? 'video' : 'photo');
    const finalOrientation = orientation || 'portrait';

    const insertProj = db.prepare(`
      INSERT INTO portfolio_projects (
        category_id, title, slug, short_description, full_description,
        client_name, project_date, location, cover_image_url, featured_video_url,
        media_type, orientation,
        is_featured, is_published, sort_order, seo_title, seo_description
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = await insertProj.run(
      category_id || null, title, finalSlug, short_description || '', full_description || '',
      client_name || '', project_date || '', location || '',
      cover_image_url || '', featured_video_url || '',
      finalMediaType, finalOrientation,
      is_featured ? 1 : 0, is_published !== undefined ? (is_published ? 1 : 0) : 1,
      nextOrder, seo_title || `${title} — AFFRAME Portfolio`, seo_description || short_description || ''
    );

    const projectId = result.lastInsertRowid;

    // Insert gallery images if provided
    if (Array.isArray(gallery_images) && gallery_images.length > 0) {
      const insertImg = db.prepare(`
        INSERT INTO portfolio_images (project_id, image_url, caption, alt_text, sort_order)
        VALUES (?, ?, ?, ?, ?)
      `);
      for (let idx = 0; idx < gallery_images.length; idx++) {
        const img = gallery_images[idx];
        const url = typeof img === 'string' ? img : img.image_url;
        const caption = typeof img === 'object' ? img.caption || '' : '';
        const alt = typeof img === 'object' ? img.alt_text || title : title;
        if (url) {
          await insertImg.run(projectId, url, caption, alt, idx + 1);
        }
      }
    }

    const created = await db.prepare('SELECT * FROM portfolio_projects WHERE id = ?').get(projectId);
    created.images = await db.prepare('SELECT * FROM portfolio_images WHERE project_id = ? ORDER BY sort_order ASC').all(projectId);

    res.status(201).json({ message: 'Proyek portofolio berhasil dibuat.', project: created });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/portfolio/projects/:id (admin update)
router.put('/projects/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      category_id, title, slug, short_description, full_description,
      client_name, project_date, location, cover_image_url, featured_video_url,
      media_type, orientation,
      is_featured, is_published, sort_order, seo_title, seo_description,
      gallery_images
    } = req.body;

    const current = await db.prepare('SELECT * FROM portfolio_projects WHERE id = ?').get(id);
    if (!current) {
      return res.status(404).json({ error: 'Proyek tidak ditemukan.' });
    }

    let finalSlug = slug ? slugify(slug) : current.slug;
    if (slug && slug !== current.slug) {
      const existing = await db.prepare('SELECT id FROM portfolio_projects WHERE slug = ? AND id != ?').get(finalSlug, id);
      if (existing) {
        finalSlug = `${finalSlug}-${Date.now().toString().slice(-4)}`;
      }
    }

    // Determine media_type if auto-updated
    let finalMediaType = media_type;
    if (!finalMediaType && featured_video_url && featured_video_url.trim() && current.media_type !== 'video') {
      finalMediaType = 'video';
    }

    await db.prepare(`
      UPDATE portfolio_projects
      SET category_id = ?,
          title = COALESCE(?, title),
          slug = ?,
          short_description = COALESCE(?, short_description),
          full_description = COALESCE(?, full_description),
          client_name = COALESCE(?, client_name),
          project_date = COALESCE(?, project_date),
          location = COALESCE(?, location),
          cover_image_url = COALESCE(?, cover_image_url),
          featured_video_url = COALESCE(?, featured_video_url),
          media_type = COALESCE(?, media_type),
          orientation = COALESCE(?, orientation),
          is_featured = COALESCE(?, is_featured),
          is_published = COALESCE(?, is_published),
          sort_order = COALESCE(?, sort_order),
          seo_title = COALESCE(?, seo_title),
          seo_description = COALESCE(?, seo_description),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      category_id !== undefined ? category_id : current.category_id,
      title, finalSlug, short_description, full_description,
      client_name, project_date, location, cover_image_url, featured_video_url,
      finalMediaType, orientation,
      is_featured !== undefined ? (is_featured ? 1 : 0) : current.is_featured,
      is_published !== undefined ? (is_published ? 1 : 0) : current.is_published,
      sort_order !== undefined ? sort_order : current.sort_order,
      seo_title, seo_description, id
    );

    // If gallery_images array is provided, replace gallery images
    if (Array.isArray(gallery_images)) {
      await db.prepare('DELETE FROM portfolio_images WHERE project_id = ?').run(id);
      const insertImg = db.prepare(`
        INSERT INTO portfolio_images (project_id, image_url, caption, alt_text, sort_order)
        VALUES (?, ?, ?, ?, ?)
      `);
      for (let idx = 0; idx < gallery_images.length; idx++) {
        const img = gallery_images[idx];
        const url = typeof img === 'string' ? img : img.image_url;
        const caption = typeof img === 'object' ? img.caption || '' : '';
        const alt = typeof img === 'object' ? img.alt_text || title || '' : (title || '');
        if (url) {
          await insertImg.run(id, url, caption, alt, idx + 1);
        }
      }
    }

    const updated = await db.prepare('SELECT * FROM portfolio_projects WHERE id = ?').get(id);
    updated.images = await db.prepare('SELECT * FROM portfolio_images WHERE project_id = ? ORDER BY sort_order ASC').all(id);

    res.json({ message: 'Proyek portofolio berhasil diperbarui.', project: updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/portfolio/projects/:id (admin delete)
router.delete('/projects/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    await db.prepare('DELETE FROM portfolio_images WHERE project_id = ?').run(id);
    await db.prepare('DELETE FROM portfolio_projects WHERE id = ?').run(id);
    res.json({ message: 'Proyek portofolio berhasil dihapus.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
