const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { authenticateToken } = require('../middleware/auth');

// All client routes require admin authentication
router.use(authenticateToken);

// GET /api/clients - List clients with filters, search, and summary stats
router.get('/', async (req, res) => {
  try {
    const {
      status,
      client_type,
      search,
      city,
      sortBy = 'created_at',
      order = 'DESC',
      limit = 50,
      page = 1
    } = req.query;

    let query = 'SELECT * FROM clients WHERE 1=1';
    const params = [];

    if (status && status !== 'all') {
      query += ' AND status = ?';
      params.push(status);
    }

    if (client_type && client_type !== 'all') {
      query += ' AND client_type = ?';
      params.push(client_type);
    }

    if (city && city !== 'all') {
      query += ' AND address_city LIKE ?';
      params.push(`%${city}%`);
    }

    if (search && search.trim()) {
      const term = `%${search.trim()}%`;
      query += ` AND (
        client_code LIKE ? OR
        full_name LIKE ? OR
        phone_whatsapp LIKE ? OR
        email LIKE ? OR
        instagram_handle LIKE ? OR
        company_brand LIKE ? OR
        address_city LIKE ?
      )`;
      params.push(term, term, term, term, term, term, term);
    }

    // Allowed sort columns
    const allowedSort = ['created_at', 'total_spend', 'full_name', 'status'];
    const finalSort = allowedSort.includes(sortBy) ? sortBy : 'created_at';
    const finalOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    query += ` ORDER BY ${finalSort} ${finalOrder} LIMIT ? OFFSET ?`;
    params.push(Number(limit), (Number(page) - 1) * Number(limit));

    const clients = await db.prepare(query).all(...params);

    // Attach total bookings count for each client
    for (const c of clients) {
      const inqCount = await db.prepare(
        'SELECT COUNT(*) as count FROM inquiries WHERE client_id = ? OR whatsapp_number = ?'
      ).get(c.id, c.phone_whatsapp);
      c.booking_count = inqCount?.count || 0;
    }

    // Summary stats
    const totalClients = (await db.prepare('SELECT COUNT(*) as count FROM clients').get())?.count || 0;
    const leadCount = (await db.prepare("SELECT COUNT(*) as count FROM clients WHERE status = 'lead'").get())?.count || 0;
    const activeCount = (await db.prepare("SELECT COUNT(*) as count FROM clients WHERE status = 'active'").get())?.count || 0;
    const vipCount = (await db.prepare("SELECT COUNT(*) as count FROM clients WHERE status = 'vip'").get())?.count || 0;
    const completedCount = (await db.prepare("SELECT COUNT(*) as count FROM clients WHERE status = 'completed'").get())?.count || 0;
    const totalSpendSum = (await db.prepare('SELECT SUM(total_spend) as sum FROM clients').get())?.sum || 0;

    res.json({
      clients,
      stats: {
        totalClients,
        leadCount,
        activeCount,
        vipCount,
        completedCount,
        totalSpendSum: Number(totalSpendSum)
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/clients/export/csv - Export all clients to CSV
router.get('/export/csv', async (req, res) => {
  try {
    const clients = await db.prepare('SELECT * FROM clients ORDER BY created_at DESC').all();

    const headers = [
      'Kode Klien', 'Nama Lengkap', 'WhatsApp / No HP', 'Email', 'Instagram',
      'Instansi / Perusahaan', 'Kategori Klien', 'Kota / Domisili', 'Status',
      'Total Belanja (Rp)', 'Catatan Khusus', 'Tanggal Terdaftar'
    ];

    const escapeCsv = (str) => {
      if (str === null || str === undefined) return '""';
      const s = String(str).replace(/"/g, '""');
      return `"${s}"`;
    };

    let csvContent = headers.join(',') + '\n';
    for (const c of clients) {
      const line = [
        escapeCsv(c.client_code),
        escapeCsv(c.full_name),
        escapeCsv(c.phone_whatsapp),
        escapeCsv(c.email),
        escapeCsv(c.instagram_handle),
        escapeCsv(c.company_brand),
        escapeCsv(c.client_type),
        escapeCsv(c.address_city),
        escapeCsv(c.status),
        escapeCsv(c.total_spend),
        escapeCsv(c.notes),
        escapeCsv(c.created_at)
      ].join(',');
      csvContent += line + '\n';
    }

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=afframe-pelanggan-${Date.now()}.csv`);
    res.send('\uFEFF' + csvContent);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/clients/:id - Get client detail with booking history
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const client = await db.prepare('SELECT * FROM clients WHERE id = ?').get(id);

    if (!client) {
      return res.status(404).json({ error: 'Data klien tidak ditemukan.' });
    }

    // Fetch related bookings/inquiries
    const bookings = await db.prepare(
      'SELECT * FROM inquiries WHERE client_id = ? OR whatsapp_number = ? ORDER BY created_at DESC'
    ).all(client.id, client.phone_whatsapp);

    client.bookings = bookings;

    res.json({ client });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/clients - Create new client
router.post('/', async (req, res) => {
  try {
    const {
      full_name,
      phone_whatsapp,
      email,
      instagram_handle,
      company_brand,
      client_type = 'personal',
      address_city = 'Lamongan',
      status = 'active',
      total_spend = 0,
      notes
    } = req.body;

    if (!full_name || !phone_whatsapp) {
      return res.status(400).json({ error: 'Nama Lengkap dan Nomor WhatsApp wajib diisi.' });
    }

    // Generate unique client code
    const client_code = 'CLI-' + Math.floor(1000 + Math.random() * 9000);

    const result = await db.prepare(`
      INSERT INTO clients (
        client_code, full_name, phone_whatsapp, email, instagram_handle,
        company_brand, client_type, address_city, status, total_spend, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      client_code,
      full_name.trim(),
      phone_whatsapp.trim(),
      email ? email.trim() : '',
      instagram_handle ? instagram_handle.trim() : '',
      company_brand ? company_brand.trim() : '',
      client_type,
      address_city ? address_city.trim() : 'Lamongan',
      status,
      Number(total_spend) || 0,
      notes ? notes.trim() : ''
    );

    const newClient = await db.prepare('SELECT * FROM clients WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json({
      message: 'Pelanggan baru berhasil ditambahkan.',
      client: newClient
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/clients/:id - Update client
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      full_name,
      phone_whatsapp,
      email,
      instagram_handle,
      company_brand,
      client_type,
      address_city,
      status,
      total_spend,
      notes
    } = req.body;

    const existing = await db.prepare('SELECT * FROM clients WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Data klien tidak ditemukan.' });
    }

    await db.prepare(`
      UPDATE clients SET
        full_name = ?,
        phone_whatsapp = ?,
        email = ?,
        instagram_handle = ?,
        company_brand = ?,
        client_type = ?,
        address_city = ?,
        status = ?,
        total_spend = ?,
        notes = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      full_name !== undefined ? full_name.trim() : existing.full_name,
      phone_whatsapp !== undefined ? phone_whatsapp.trim() : existing.phone_whatsapp,
      email !== undefined ? email.trim() : existing.email,
      instagram_handle !== undefined ? instagram_handle.trim() : existing.instagram_handle,
      company_brand !== undefined ? company_brand.trim() : existing.company_brand,
      client_type !== undefined ? client_type : existing.client_type,
      address_city !== undefined ? address_city.trim() : existing.address_city,
      status !== undefined ? status : existing.status,
      total_spend !== undefined ? Number(total_spend) : existing.total_spend,
      notes !== undefined ? notes.trim() : existing.notes,
      id
    );

    const updated = await db.prepare('SELECT * FROM clients WHERE id = ?').get(id);

    res.json({
      message: 'Data pelanggan berhasil diperbarui.',
      client: updated
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/clients/:id - Delete client
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await db.prepare('SELECT * FROM clients WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Data klien tidak ditemukan.' });
    }

    // Unlink inquiries
    await db.prepare('UPDATE inquiries SET client_id = NULL WHERE client_id = ?').run(id);

    // Delete client
    await db.prepare('DELETE FROM clients WHERE id = ?').run(id);

    res.json({ message: `Pelanggan "${existing.full_name}" berhasil dihapus.` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
