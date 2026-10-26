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
// SERVICES (Categories)
// ==========================================

// GET /api/services (public & admin)
router.get('/', async (req, res) => {
  try {
    const { all } = req.query;
    let query = 'SELECT * FROM services';
    if (!all) {
      query += ' WHERE is_visible = 1';
    }
    query += ' ORDER BY sort_order ASC, id ASC';

    const services = await db.prepare(query).all();

    // Attach packages to each service
    const getPackages = db.prepare(`
      SELECT * FROM service_packages
      WHERE service_id = ? ${!all ? 'AND is_published = 1' : ''}
      ORDER BY sort_order ASC, id ASC
    `);

    for (const s of services) {
      const pkgs = await getPackages.all(s.id);
      s.packages = pkgs.map(p => ({
        ...p,
        deliverables: JSON.parse(p.deliverables_json || '[]'),
        inclusions: JSON.parse(p.inclusions_json || '[]')
      }));
    }

    res.json({ services });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/services (admin)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, slug, short_description, icon_name, cover_image_url, sort_order } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Nama kategori layanan wajib diisi.' });
    }

    const finalSlug = slug ? slugify(slug) : slugify(name);
    const maxOrder = await db.prepare('SELECT MAX(sort_order) as m FROM services').get();
    const nextOrder = sort_order !== undefined ? sort_order : (maxOrder?.m || 0) + 1;

    const result = await db.prepare(`
      INSERT INTO services (name, slug, short_description, icon_name, cover_image_url, is_visible, sort_order)
      VALUES (?, ?, ?, ?, ?, 1, ?)
    `).run(name, finalSlug, short_description || '', icon_name || 'Camera', cover_image_url || '', nextOrder);

    const created = await db.prepare('SELECT * FROM services WHERE id = ?').get(result.lastInsertRowid);
    created.packages = [];
    res.status(201).json({ message: 'Kategori layanan berhasil ditambahkan.', service: created });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/services/:id (admin)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, slug, short_description, icon_name, cover_image_url, is_visible, sort_order } = req.body;

    const current = await db.prepare('SELECT * FROM services WHERE id = ?').get(id);
    if (!current) {
      return res.status(404).json({ error: 'Kategori layanan tidak ditemukan.' });
    }

    const finalSlug = slug ? slugify(slug) : (name ? slugify(name) : current.slug);

    await db.prepare(`
      UPDATE services
      SET name = COALESCE(?, name),
          slug = ?,
          short_description = COALESCE(?, short_description),
          icon_name = COALESCE(?, icon_name),
          cover_image_url = COALESCE(?, cover_image_url),
          is_visible = COALESCE(?, is_visible),
          sort_order = COALESCE(?, sort_order),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(name, finalSlug, short_description, icon_name, cover_image_url, is_visible, sort_order, id);

    const updated = await db.prepare('SELECT * FROM services WHERE id = ?').get(id);
    res.json({ message: 'Kategori layanan berhasil diperbarui.', service: updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/services/:id (admin)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    await db.prepare('DELETE FROM service_packages WHERE service_id = ?').run(id);
    await db.prepare('DELETE FROM services WHERE id = ?').run(id);
    res.json({ message: 'Kategori layanan dan seluruh paket di dalamnya berhasil dihapus.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// PACKAGES
// ==========================================

// GET /api/services/packages (all packages flat list)
router.get('/packages/all', async (req, res) => {
  try {
    const { all } = req.query;
    let query = `
      SELECT sp.*, s.name as service_title, s.slug as service_slug
      FROM service_packages sp
      JOIN services s ON sp.service_id = s.id
      WHERE 1=1
    `;
    if (!all) {
      query += ' AND sp.is_published = 1 AND s.is_visible = 1';
    }
    query += ' ORDER BY s.sort_order ASC, sp.sort_order ASC, sp.id ASC';

    const raw = await db.prepare(query).all();
    const packages = raw.map(p => ({
      ...p,
      deliverables: JSON.parse(p.deliverables_json || '[]'),
      inclusions: JSON.parse(p.inclusions_json || '[]')
    }));

    res.json({ packages });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/services/packages (admin)
router.post('/packages', authenticateToken, async (req, res) => {
  try {
    const {
      service_id, category_name, package_name,
      regular_price, promotional_price,
      is_price_hidden, is_quotation_based,
      duration, deliverables, inclusions,
      is_featured, is_published, sort_order
    } = req.body;

    if (!service_id || !package_name) {
      return res.status(400).json({ error: 'Layanan induk dan nama paket wajib diisi.' });
    }

    const service = await db.prepare('SELECT name FROM services WHERE id = ?').get(service_id);
    const catName = category_name || (service ? service.name : 'General');

    const maxOrder = await db.prepare('SELECT MAX(sort_order) as m FROM service_packages WHERE service_id = ?').get(service_id);
    const nextOrder = sort_order !== undefined ? sort_order : (maxOrder?.m || 0) + 1;

    const deliverablesJson = JSON.stringify(Array.isArray(deliverables) ? deliverables : (deliverables ? deliverables.split('\n').filter(Boolean) : []));
    const inclusionsJson = JSON.stringify(Array.isArray(inclusions) ? inclusions : []);

    const result = await db.prepare(`
      INSERT INTO service_packages (
        service_id, category_name, package_name,
        regular_price, promotional_price,
        is_price_hidden, is_quotation_based,
        duration, deliverables_json, inclusions_json,
        is_featured, is_published, sort_order
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      service_id, catName, package_name,
      Number(regular_price) || 0, Number(promotional_price) || 0,
      is_price_hidden ? 1 : 0, is_quotation_based ? 1 : 0,
      duration || '', deliverablesJson, inclusionsJson,
      is_featured ? 1 : 0, is_published !== undefined ? (is_published ? 1 : 0) : 1, nextOrder
    );

    const created = await db.prepare('SELECT * FROM service_packages WHERE id = ?').get(result.lastInsertRowid);
    created.deliverables = JSON.parse(created.deliverables_json || '[]');
    created.inclusions = JSON.parse(created.inclusions_json || '[]');

    res.status(201).json({ message: 'Paket berhasil ditambahkan.', package: created });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/services/packages/:id/duplicate (admin)
router.post('/packages/:id/duplicate', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const original = await db.prepare('SELECT * FROM service_packages WHERE id = ?').get(id);
    if (!original) {
      return res.status(404).json({ error: 'Paket tidak ditemukan.' });
    }

    const maxOrder = await db.prepare('SELECT MAX(sort_order) as m FROM service_packages WHERE service_id = ?').get(original.service_id);

    const result = await db.prepare(`
      INSERT INTO service_packages (
        service_id, category_name, package_name,
        regular_price, promotional_price,
        is_price_hidden, is_quotation_based,
        duration, deliverables_json, inclusions_json,
        is_featured, is_published, sort_order
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
    `).run(
      original.service_id, original.category_name, `${original.package_name} (Copy)`,
      original.regular_price, original.promotional_price,
      original.is_price_hidden, original.is_quotation_based,
      original.duration, original.deliverables_json, original.inclusions_json,
      0, (maxOrder?.m || 0) + 1
    );

    const duplicated = await db.prepare('SELECT * FROM service_packages WHERE id = ?').get(result.lastInsertRowid);
    duplicated.deliverables = JSON.parse(duplicated.deliverables_json || '[]');
    duplicated.inclusions = JSON.parse(duplicated.inclusions_json || '[]');

    res.status(201).json({ message: 'Paket berhasil diduplikasi.', package: duplicated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/services/packages/:id (admin)
router.put('/packages/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      service_id, category_name, package_name,
      regular_price, promotional_price,
      is_price_hidden, is_quotation_based,
      duration, deliverables, inclusions,
      is_featured, is_published, sort_order
    } = req.body;

    const current = await db.prepare('SELECT * FROM service_packages WHERE id = ?').get(id);
    if (!current) {
      return res.status(404).json({ error: 'Paket tidak ditemukan.' });
    }

    let delivJson = current.deliverables_json;
    if (deliverables !== undefined) {
      delivJson = JSON.stringify(Array.isArray(deliverables) ? deliverables : deliverables.split('\n').filter(Boolean));
    }

    let inclJson = current.inclusions_json;
    if (inclusions !== undefined) {
      inclJson = JSON.stringify(Array.isArray(inclusions) ? inclusions : []);
    }

    await db.prepare(`
      UPDATE service_packages
      SET service_id = COALESCE(?, service_id),
          category_name = COALESCE(?, category_name),
          package_name = COALESCE(?, package_name),
          regular_price = COALESCE(?, regular_price),
          promotional_price = COALESCE(?, promotional_price),
          is_price_hidden = COALESCE(?, is_price_hidden),
          is_quotation_based = COALESCE(?, is_quotation_based),
          duration = COALESCE(?, duration),
          deliverables_json = ?,
          inclusions_json = ?,
          is_featured = COALESCE(?, is_featured),
          is_published = COALESCE(?, is_published),
          sort_order = COALESCE(?, sort_order),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      service_id, category_name, package_name,
      regular_price !== undefined ? Number(regular_price) : null,
      promotional_price !== undefined ? Number(promotional_price) : null,
      is_price_hidden !== undefined ? (is_price_hidden ? 1 : 0) : null,
      is_quotation_based !== undefined ? (is_quotation_based ? 1 : 0) : null,
      duration, delivJson, inclJson,
      is_featured !== undefined ? (is_featured ? 1 : 0) : null,
      is_published !== undefined ? (is_published ? 1 : 0) : null,
      sort_order, id
    );

    const updated = await db.prepare('SELECT * FROM service_packages WHERE id = ?').get(id);
    updated.deliverables = JSON.parse(updated.deliverables_json || '[]');
    updated.inclusions = JSON.parse(updated.inclusions_json || '[]');

    res.json({ message: 'Paket berhasil diperbarui.', package: updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/services/packages/:id (admin)
router.delete('/packages/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    await db.prepare('DELETE FROM service_packages WHERE id = ?').run(id);
    res.json({ message: 'Paket berhasil dihapus.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
