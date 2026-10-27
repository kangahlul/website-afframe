const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { authenticateToken } = require('../middleware/auth');

// GET /api/dashboard/stats (ADMIN ONLY)
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    // 1. Portfolio stats
    const publishedProjects = (await db.prepare('SELECT COUNT(*) as count FROM portfolio_projects WHERE is_published = 1').get())?.count || 0;
    const draftProjects = (await db.prepare('SELECT COUNT(*) as count FROM portfolio_projects WHERE is_published = 0').get())?.count || 0;
    const totalCategories = (await db.prepare('SELECT COUNT(*) as count FROM portfolio_categories').get())?.count || 0;

    // 2. Services & Packages
    const totalServices = (await db.prepare('SELECT COUNT(*) as count FROM services WHERE is_visible = 1').get())?.count || 0;
    const totalPackages = (await db.prepare('SELECT COUNT(*) as count FROM service_packages WHERE is_published = 1').get())?.count || 0;

    // 3. Inquiries breakdown
    const totalInquiries = (await db.prepare('SELECT COUNT(*) as count FROM inquiries').get())?.count || 0;
    const newInquiries = (await db.prepare("SELECT COUNT(*) as count FROM inquiries WHERE status = 'new'").get())?.count || 0;
    const contactedInquiries = (await db.prepare("SELECT COUNT(*) as count FROM inquiries WHERE status = 'contacted'").get())?.count || 0;
    const quotedInquiries = (await db.prepare("SELECT COUNT(*) as count FROM inquiries WHERE status = 'quoted'").get())?.count || 0;
    const confirmedBookings = (await db.prepare("SELECT COUNT(*) as count FROM inquiries WHERE status = 'confirmed'").get())?.count || 0;
    const completedBookings = (await db.prepare("SELECT COUNT(*) as count FROM inquiries WHERE status = 'completed'").get())?.count || 0;
    const cancelledInquiries = (await db.prepare("SELECT COUNT(*) as count FROM inquiries WHERE status = 'cancelled'").get())?.count || 0;

    // 4. Clients / CRM metrics
    const totalClients = (await db.prepare('SELECT COUNT(*) as count FROM clients').get())?.count || 0;
    const activeClients = (await db.prepare("SELECT COUNT(*) as count FROM clients WHERE status = 'active'").get())?.count || 0;
    const vipClients = (await db.prepare("SELECT COUNT(*) as count FROM clients WHERE status = 'vip'").get())?.count || 0;
    const leadClients = (await db.prepare("SELECT COUNT(*) as count FROM clients WHERE status = 'lead'").get())?.count || 0;
    const totalRevenueSum = (await db.prepare('SELECT SUM(total_spend) as sum FROM clients').get())?.sum || 0;

    // 5. Media stats
    const totalMedia = (await db.prepare('SELECT COUNT(*) as count FROM media_assets').get())?.count || 0;

    // 6. Recent Inquiries (real DB records)
    const recentInquiries = await db.prepare(`
      SELECT id, inquiry_code, full_name, whatsapp_number, email, company, service_name, package_name, event_date, location, status, created_at
      FROM inquiries
      ORDER BY created_at DESC
      LIMIT 6
    `).all();

    // 7. Recent Clients
    const recentClients = await db.prepare(`
      SELECT id, client_code, full_name, phone_whatsapp, client_type, address_city, status, total_spend, created_at
      FROM clients
      ORDER BY created_at DESC
      LIMIT 6
    `).all();

    // 8. Recent Projects
    const recentProjects = await db.prepare(`
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
        contactedInquiries,
        quotedInquiries,
        confirmedBookings,
        completedBookings,
        cancelledInquiries,
        totalClients,
        activeClients,
        vipClients,
        leadClients,
        pipelineValue: Number(totalRevenueSum),
        totalMedia
      },
      statusBreakdown: {
        new: newInquiries,
        contacted: contactedInquiries,
        quoted: quotedInquiries,
        confirmed: confirmedBookings,
        completed: completedBookings,
        cancelled: cancelledInquiries
      },
      recentInquiries,
      recentClients,
      recentProjects
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
