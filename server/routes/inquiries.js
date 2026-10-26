const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { authenticateToken } = require('../middleware/auth');

// POST /api/inquiries (PUBLIC booking form submission)
router.post('/', (req, res) => {
  try {
    const {
      full_name, whatsapp_number, email, instagram_handle, company,
      service_id, package_id, service_name, package_name,
      event_date, event_time, location, budget_range, additional_notes, agreed_terms
    } = req.body;

    if (!full_name || !whatsapp_number || !event_date || !location) {
      return res.status(400).json({
        error: 'Mohon lengkapi kolom wajib: Nama Lengkap, Nomor WhatsApp, Tanggal Acara, dan Lokasi.'
      });
    }

    if (!agreed_terms) {
      return res.status(400).json({
        error: 'Anda harus menyetujui Syarat & Ketentuan AF Frame sebelum mengirim formulir.'
      });
    }

    // Generate unique inquiry code (e.g. AF-YYYYMM-XXXX)
    const dateStr = new Date().toISOString().slice(0, 7).replace('-', '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const inquiry_code = `AF-${dateStr}-${randomSuffix}`;

    // Get service & package names if IDs were provided but names are missing
    let finalServiceName = service_name || '';
    if (!finalServiceName && service_id) {
      const s = db.prepare('SELECT name FROM services WHERE id = ?').get(service_id);
      if (s) finalServiceName = s.name;
    }

    let finalPackageName = package_name || '';
    if (!finalPackageName && package_id) {
      const p = db.prepare('SELECT package_name FROM service_packages WHERE id = ?').get(package_id);
      if (p) finalPackageName = p.package_name;
    }

    const insertStmt = db.prepare(`
      INSERT INTO inquiries (
        inquiry_code, full_name, whatsapp_number, email, instagram_handle, company,
        service_id, package_id, service_name, package_name,
        event_date, event_time, location, budget_range, additional_notes, agreed_terms, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 'new')
    `);

    const result = insertStmt.run(
      inquiry_code, full_name.trim(), whatsapp_number.trim(), email ? email.trim() : '',
      instagram_handle ? instagram_handle.trim() : '', company ? company.trim() : '',
      service_id || null, package_id || null, finalServiceName, finalPackageName,
      event_date, event_time || '', location.trim(), budget_range || '',
      additional_notes || ''
    );

    // Get WhatsApp business phone number from settings
    const waSetting = db.prepare("SELECT value FROM site_settings WHERE key = 'whatsapp_number'").get();
    const rawWaNumber = waSetting ? waSetting.value : '085755152579';
    // Format to 62...
    let cleanWaNumber = rawWaNumber.replace(/[^0-9]/g, '');
    if (cleanWaNumber.startsWith('0')) {
      cleanWaNumber = '62' + cleanWaNumber.slice(1);
    }

    // Build natural Indonesian WhatsApp prefilled message
    let waMessage = `Halo AF Frame, saya ingin konsultasi & booking sesi dokumentasi.\n\n`;
    waMessage += `*Kode Inquiry:* ${inquiry_code}\n`;
    waMessage += `*Nama:* ${full_name}\n`;
    waMessage += `*WhatsApp:* ${whatsapp_number}\n`;
    if (instagram_handle) waMessage += `*Instagram:* ${instagram_handle}\n`;
    if (company) waMessage += `*Instansi/Brand:* ${company}\n`;
    if (finalServiceName) waMessage += `*Layanan:* ${finalServiceName}\n`;
    if (finalPackageName) waMessage += `*Pilihan Paket:* ${finalPackageName}\n`;
    waMessage += `*Tanggal Acara:* ${event_date}\n`;
    if (event_time) waMessage += `*Waktu Acara:* ${event_time}\n`;
    waMessage += `*Lokasi Acara:* ${location}\n`;
    if (budget_range) waMessage += `*Estimasi Budget:* ${budget_range}\n`;
    if (additional_notes) waMessage += `*Catatan/Konsep:* ${additional_notes}\n`;
    waMessage += `\nMohon informasi ketersediaan jadwal tim AF Frame. Terima kasih!`;

    const whatsappRedirectUrl = `https://wa.me/${cleanWaNumber}?text=${encodeURIComponent(waMessage)}`;

    res.status(201).json({
      message: 'Inquiry berhasil dikirim dan tersimpan di sistem.',
      inquiry_code,
      inquiry_id: result.lastInsertRowid,
      whatsappRedirectUrl
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/inquiries (ADMIN ONLY - protected)
router.get('/', authenticateToken, (req, res) => {
  try {
    const { status, search, limit = 50, page = 1 } = req.query;
    let query = 'SELECT * FROM inquiries WHERE 1=1';
    const params = [];

    if (status && status !== 'all') {
      query += ' AND status = ?';
      params.push(status);
    }

    if (search) {
      query += ' AND (inquiry_code LIKE ? OR full_name LIKE ? OR whatsapp_number LIKE ? OR location LIKE ? OR company LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(Number(limit), (Number(page) - 1) * Number(limit));

    const inquiries = db.prepare(query).all(...params);

    // Attach staff notes count
    const getNotes = db.prepare('SELECT * FROM inquiry_notes WHERE inquiry_id = ? ORDER BY created_at DESC');
    for (const inq of inquiries) {
      inq.notes = getNotes.all(inq.id);
    }

    const totalCount = db.prepare('SELECT COUNT(*) as count FROM inquiries').get().count;

    res.json({ inquiries, totalCount });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/inquiries/:id (ADMIN ONLY)
router.get('/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const inquiry = db.prepare('SELECT * FROM inquiries WHERE id = ?').get(id);
    if (!inquiry) {
      return res.status(404).json({ error: 'Data inquiry tidak ditemukan.' });
    }

    inquiry.notes = db.prepare('SELECT * FROM inquiry_notes WHERE inquiry_id = ? ORDER BY created_at DESC').all(id);

    res.json({ inquiry });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/inquiries/:id/status (ADMIN ONLY)
router.put('/:id/status', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowed = ['new', 'contacted', 'quoted', 'confirmed', 'completed', 'cancelled'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ error: 'Status tidak valid.' });
    }

    db.prepare('UPDATE inquiries SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(status, id);
    const updated = db.prepare('SELECT * FROM inquiries WHERE id = ?').get(id);

    res.json({ message: `Status berhasil diubah menjadi "${status}".`, inquiry: updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/inquiries/:id/notes (ADMIN ONLY)
router.post('/:id/notes', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const { note } = req.body;

    if (!note || !note.trim()) {
      return res.status(400).json({ error: 'Isi catatan tidak boleh kosong.' });
    }

    const author = req.user.username || 'Admin';
    db.prepare('INSERT INTO inquiry_notes (inquiry_id, author_name, note) VALUES (?, ?, ?)').run(id, author, note.trim());

    const notes = db.prepare('SELECT * FROM inquiry_notes WHERE inquiry_id = ? ORDER BY created_at DESC').all(id);
    res.status(201).json({ message: 'Catatan internal berhasil ditambahkan.', notes });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/inquiries/export/csv (ADMIN ONLY)
router.get('/export/csv', authenticateToken, (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM inquiries ORDER BY created_at DESC').all();

    // Generate CSV
    const headers = [
      'Kode Inquiry', 'Nama Klien', 'No WhatsApp', 'Email', 'Instagram',
      'Instansi/Perusahaan', 'Layanan', 'Paket', 'Tanggal Acara', 'Waktu Acara',
      'Lokasi', 'Budget', 'Catatan Tambahan', 'Status', 'Tanggal Masuk'
    ];

    const escapeCsv = (str) => {
      if (str === null || str === undefined) return '""';
      const s = String(str).replace(/"/g, '""');
      return `"${s}"`;
    };

    let csvContent = headers.join(',') + '\n';
    for (const r of rows) {
      const line = [
        escapeCsv(r.inquiry_code),
        escapeCsv(r.full_name),
        escapeCsv(r.whatsapp_number),
        escapeCsv(r.email),
        escapeCsv(r.instagram_handle),
        escapeCsv(r.company),
        escapeCsv(r.service_name),
        escapeCsv(r.package_name),
        escapeCsv(r.event_date),
        escapeCsv(r.event_time),
        escapeCsv(r.location),
        escapeCsv(r.budget_range),
        escapeCsv(r.additional_notes),
        escapeCsv(r.status),
        escapeCsv(r.created_at)
      ].join(',');
      csvContent += line + '\n';
    }

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=afframe-inquiries-${Date.now()}.csv`);
    res.send('\uFEFF' + csvContent); // Add UTF-8 BOM for Excel
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
