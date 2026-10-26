const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { authenticateToken } = require('../middleware/auth');

// GET /api/dashboard/stats (ADMIN ONLY)
router.get('/stats', authenticateToken, (req, res) => {
  try {
    // 1. Portfolio stats
    const publishedProjects = db.prepare('SELECT COUNT(*) as count FROM portfolio_projects WHERE is_published = 1').get().count;
    const draftProjects = db.prepare('SELECT COUNT(*) as count FROM portfolio_projects WHERE is_published = 0').get().count;
    const totalCategories = db.prepare('SELECT COUNT(*) as count FROM portfolio_categories').get().count;

    // 2. Services & Packages
    const totalServices = db.prepare('SELECT COUNT(*) as count FROM services WHERE is_visible = 1').get().count;
    const totalPackages = db.prepare('SELECT COUNT(*) as count FROM service_packages WHERE is_published = 1').get().count;

    // 3. Inquiries breakdown
    const totalInquiries = db.prepare('SELECT COUNT(*) as count FROM inquiries').get().count;
    const newInquiries = db.prepare("SELECT COUNT(*) as count FROM inquiries WHERE status = 'new'").get().count;
    const confirmedBookings = db.prepare("SELECT COUNT(*) as count FROM inquiries WHERE status = 'confirmed'").get().count;
    const quotedInquiries = db.prepare("SELECT COUNT(*) as count FROM inquiries WHERE status = 'quoted'").get().count;

    // 4. Media stats
    const totalMedia = db.prepare('SELECT COUNT(*) as count FROM media_assets').get().count;

    // 5. Recent Inquiries (real DB records)
    const recentInquiries = db.prepare(`
      SELECT id, inquiry_code, full_name, whatsapp_number, service_name, package_name, event_date, status, created_at
      FROM inquiries
      ORDER BY created_at DESC
      LIMIT 5
    `).all();

    // 6. Recent Projects
    const recentProjects = db.prepare(`
      SELECT pp.id, pp.title, pp.slug, pp.cover_image_url, pp.is_published, pp.created_at, pc.name as category_name
      FROM portfolio_projects pp
      LEFT JOIN portfolio_categories pc ON pp.category_id = pc.id
      ORDER BY pp.updated_at DESC
      LIMIT 5
    `).all();

    res.json({
      metrics: {
        publishedProjects,
        draftProjects,
        totalCategories,
        totalServices,
        totalPackages,
        totalInquiries,
        newInquiries,
        confirmedBookings,
        quotedInquiries,
        totalMedia
      },
      recentInquiries,
      recentProjects
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
