const Database = require('better-sqlite3');
const { createClient } = require('@libsql/client');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

// Ensure data and uploads directory exist
const dataDir = path.join(__dirname, 'data');
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const dbPath = path.join(dataDir, 'afframe.db');
const db = new Database(dbPath);

// Enable WAL mode and foreign keys for high performance and integrity
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Turso Cloud Client (if configured in .env or environment)
const TURSO_URL = process.env.TURSO_DATABASE_URL;
const TURSO_TOKEN = process.env.TURSO_AUTH_TOKEN;

let tursoClient = null;
if (TURSO_URL && TURSO_TOKEN) {
  try {
    tursoClient = createClient({
      url: TURSO_URL,
      authToken: TURSO_TOKEN
    });
    console.log('[Turso] Cloud Database Client Connected:', TURSO_URL);
  } catch (err) {
    console.error('[Turso] Failed to initialize Turso Client:', err.message);
  }
}

// Intercept db.prepare to transparently sync all writes (INSERT/UPDATE/DELETE/REPLACE) to Turso Cloud in real time
const originalPrepare = db.prepare.bind(db);
db.prepare = function(sql) {
  const stmt = originalPrepare(sql);
  const originalRun = stmt.run.bind(stmt);
  const isWrite = /^\s*(INSERT|UPDATE|DELETE|REPLACE)/i.test(sql);

  stmt.run = function(...args) {
    const res = originalRun(...args);
    if (isWrite && tursoClient) {
      tursoClient.execute({ sql, args: args.flat() }).catch(err => {
        console.error('[Turso Sync Warning]', err.message);
      });
    }
    return res;
  };
  return stmt;
};

// Sync data from Turso Cloud on startup to restore persistent records across restarts
async function syncFromTurso() {
  if (!tursoClient) return;
  try {
    const tables = [
      'admin_users', 'site_settings', 'website_sections', 'website_pages',
      'navigation_items', 'portfolio_categories', 'portfolio_projects',
      'portfolio_images', 'services', 'service_packages', 'benefits',
      'terms_content', 'faq_items', 'service_areas', 'inquiries',
      'inquiry_notes', 'media_assets'
    ];

    const check = await tursoClient.execute('SELECT COUNT(*) as cnt FROM admin_users');
    if (!check.rows || check.rows[0].cnt === 0) {
      console.log('[Turso] Cloud database is empty or initial.');
      return;
    }

    db.pragma('foreign_keys = OFF');
    for (const table of tables) {
      const res = await tursoClient.execute(`SELECT * FROM ${table}`);
      if (!res.rows) continue;

      db.exec(`DELETE FROM ${table};`);
      if (res.rows.length === 0) continue;

      const keys = Object.keys(res.rows[0]);
      const placeholders = keys.map(() => '?').join(', ');
      const insertStmt = originalPrepare(`INSERT OR REPLACE INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`);

      const tx = db.transaction((rows) => {
        for (const row of rows) {
          insertStmt.run(Object.values(row));
        }
      });
      tx(res.rows);
    }
    db.pragma('foreign_keys = ON');
    console.log('[Turso] Startup sync complete. Local cache restored from Turso Cloud.');
  } catch (err) {
    db.pragma('foreign_keys = ON');
    console.error('[Turso Sync Error on startup]', err.message);
  }
}

// Initialize database schema
function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS admin_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT DEFAULT 'admin',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS site_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT NOT NULL UNIQUE,
      value TEXT NOT NULL,
      type TEXT DEFAULT 'string',
      group_name TEXT DEFAULT 'general',
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS media_assets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename TEXT NOT NULL,
      original_name TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      file_size INTEGER NOT NULL,
      width INTEGER,
      height INTEGER,
      category TEXT DEFAULT 'general',
      url TEXT NOT NULL,
      alt_text TEXT DEFAULT '',
      description TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS website_sections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      section_key TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      subtitle TEXT DEFAULT '',
      description TEXT DEFAULT '',
      cta_primary_text TEXT DEFAULT '',
      cta_primary_url TEXT DEFAULT '',
      cta_secondary_text TEXT DEFAULT '',
      cta_secondary_url TEXT DEFAULT '',
      background_media_url TEXT DEFAULT '',
      background_type TEXT DEFAULT 'image',
      overlay_opacity INTEGER DEFAULT 50,
      focal_point TEXT DEFAULT 'center',
      text_alignment TEXT DEFAULT 'left',
      theme TEXT DEFAULT 'dark',
      is_visible INTEGER DEFAULT 1,
      sort_order INTEGER DEFAULT 0,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS website_pages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      description TEXT DEFAULT '',
      content_json TEXT DEFAULT '{}',
      seo_title TEXT DEFAULT '',
      seo_description TEXT DEFAULT '',
      og_image_url TEXT DEFAULT '',
      is_published INTEGER DEFAULT 1,
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS navigation_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      label TEXT NOT NULL,
      url TEXT NOT NULL,
      target TEXT DEFAULT '_self',
      location TEXT DEFAULT 'header',
      is_visible INTEGER DEFAULT 1,
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS portfolio_categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      slug TEXT NOT NULL UNIQUE,
      description TEXT DEFAULT '',
      cover_image_url TEXT DEFAULT '',
      thumbnail_url TEXT DEFAULT '',
      is_visible INTEGER DEFAULT 1,
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS portfolio_projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER REFERENCES portfolio_categories(id) ON DELETE SET NULL,
      title TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      short_description TEXT DEFAULT '',
      full_description TEXT DEFAULT '',
      client_name TEXT DEFAULT '',
      project_date TEXT DEFAULT '',
      location TEXT DEFAULT '',
      cover_image_url TEXT DEFAULT '',
      featured_video_url TEXT DEFAULT '',
      is_featured INTEGER DEFAULT 0,
      is_published INTEGER DEFAULT 1,
      sort_order INTEGER DEFAULT 0,
      seo_title TEXT DEFAULT '',
      seo_description TEXT DEFAULT '',
      og_image_url TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS portfolio_images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL REFERENCES portfolio_projects(id) ON DELETE CASCADE,
      image_url TEXT NOT NULL,
      caption TEXT DEFAULT '',
      alt_text TEXT DEFAULT '',
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS services (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      short_description TEXT DEFAULT '',
      icon_name TEXT DEFAULT 'Camera',
      cover_image_url TEXT DEFAULT '',
      is_visible INTEGER DEFAULT 1,
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS service_packages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      service_id INTEGER NOT NULL REFERENCES services(id) ON DELETE CASCADE,
      category_name TEXT NOT NULL,
      package_name TEXT NOT NULL,
      regular_price INTEGER DEFAULT 0,
      promotional_price INTEGER DEFAULT 0,
      is_price_hidden INTEGER DEFAULT 0,
      is_quotation_based INTEGER DEFAULT 0,
      duration TEXT DEFAULT '',
      deliverables_json TEXT DEFAULT '[]',
      inclusions_json TEXT DEFAULT '[]',
      is_featured INTEGER DEFAULT 0,
      is_published INTEGER DEFAULT 1,
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS inquiries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      inquiry_code TEXT NOT NULL UNIQUE,
      full_name TEXT NOT NULL,
      whatsapp_number TEXT NOT NULL,
      email TEXT DEFAULT '',
      instagram_handle TEXT DEFAULT '',
      company TEXT DEFAULT '',
      service_id INTEGER,
      package_id INTEGER,
      service_name TEXT DEFAULT '',
      package_name TEXT DEFAULT '',
      event_date TEXT NOT NULL,
      event_time TEXT DEFAULT '',
      location TEXT NOT NULL,
      budget_range TEXT DEFAULT '',
      additional_notes TEXT DEFAULT '',
      agreed_terms INTEGER DEFAULT 1,
      status TEXT DEFAULT 'new',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS inquiry_notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      inquiry_id INTEGER NOT NULL REFERENCES inquiries(id) ON DELETE CASCADE,
      author_name TEXT NOT NULL,
      note TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS faq_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      question TEXT NOT NULL,
      answer TEXT NOT NULL,
      category TEXT DEFAULT 'general',
      is_published INTEGER DEFAULT 1,
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS terms_content (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      clause_number INTEGER DEFAULT 1,
      clause_text TEXT NOT NULL,
      is_published INTEGER DEFAULT 1,
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS benefits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      icon_name TEXT DEFAULT 'Sparkles',
      image_url TEXT DEFAULT '',
      is_visible INTEGER DEFAULT 1,
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS service_areas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      image_url TEXT DEFAULT '',
      is_primary INTEGER DEFAULT 1,
      is_visible INTEGER DEFAULT 1,
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  seedDefaultData();
  if (tursoClient) {
    syncFromTurso();
  }
}

// Seed initial default data matching the AF Frame Catalog
function seedDefaultData() {
  // 1. Seed Admin User
  const adminCheck = db.prepare('SELECT COUNT(*) as count FROM admin_users').get();
  if (adminCheck.count === 0) {
    const passwordHash = bcrypt.hashSync('Afframe2026!', 10);
    db.prepare(`
      INSERT INTO admin_users (username, email, password_hash, role)
      VALUES (?, ?, ?, ?)
    `).run('admin', 'admin@afframe.com', passwordHash, 'superadmin');
    console.log('[Seed] Admin user seeded (admin@afframe.com / Afframe2026!)');
  }

  // 2. Seed Site Settings
  const settingsCheck = db.prepare('SELECT COUNT(*) as count FROM site_settings').get();
  if (settingsCheck.count === 0) {
    const defaultSettings = [
      { key: 'brand_name', value: 'AF Frame', type: 'string', group_name: 'general' },
      { key: 'tagline', value: 'Capturing Meaningful Moments.', type: 'string', group_name: 'general' },
      { key: 'brand_description', value: 'AF Frame adalah layanan content creator dan dokumentasi moment yang berfokus pada mengabadikan momen spesial dalam bentuk foto, video cinematic, dan konten media sosial.', type: 'string', group_name: 'general' },
      { key: 'whatsapp_number', value: '085755152579', type: 'string', group_name: 'contact' },
      { key: 'whatsapp_url', value: 'https://wa.me/6285755152579', type: 'string', group_name: 'contact' },
      { key: 'instagram_handle', value: '@_afframe', type: 'string', group_name: 'contact' },
      { key: 'instagram_url', value: 'https://www.instagram.com/_afframe/', type: 'string', group_name: 'contact' },
      { key: 'email', value: 'afframe.production@gmail.com', type: 'string', group_name: 'contact' },
      { key: 'address', value: 'Lamongan, Gresik, Surabaya & Sekitarnya, Jawa Timur', type: 'string', group_name: 'contact' },
      { key: 'primary_color', value: '#C5A880', type: 'string', group_name: 'appearance' },
      { key: 'bg_color', value: '#0C0C0D', type: 'string', group_name: 'appearance' },
      { key: 'accent_color', value: '#E2D2BC', type: 'string', group_name: 'appearance' },
      { key: 'heading_font', value: 'Cormorant Garamond', type: 'string', group_name: 'appearance' },
      { key: 'body_font', value: 'Plus Jakarta Sans', type: 'string', group_name: 'appearance' },
      { key: 'logo_primary', value: '', type: 'string', group_name: 'media' },
      { key: 'logo_light', value: '', type: 'string', group_name: 'media' },
      { key: 'logo_dark', value: '', type: 'string', group_name: 'media' },
      { key: 'logo_monogram', value: '', type: 'string', group_name: 'media' },
      { key: 'favicon_url', value: '/favicon.svg', type: 'string', group_name: 'media' },
      { key: 'og_image', value: 'https://images.unsplash.com/photo-1537633552985-df8429e8048b?q=80&w=1200&auto=format&fit=crop', type: 'string', group_name: 'seo' },
      { key: 'seo_title', value: 'AF Frame — Capturing Meaningful Moments | Photography & Cinematic Production', type: 'string', group_name: 'seo' },
      { key: 'seo_description', value: 'Layanan dokumentasi foto & cinematic video profesional: Corporate Event, Graduation, Wedding & Gathering, Creative Content, Personal Branding & Tour Travel di Lamongan, Gresik, Surabaya.', type: 'string', group_name: 'seo' },
      { key: 'footer_copyright', value: '© 2026 AF Frame. All rights reserved. Capturing Meaningful Moments.', type: 'string', group_name: 'footer' }
    ];

    const insertSetting = db.prepare(`
      INSERT INTO site_settings (key, value, type, group_name) VALUES (?, ?, ?, ?)
    `);
    for (const s of defaultSettings) {
      insertSetting.run(s.key, s.value, s.type, s.group_name);
    }
    console.log('[Seed] Site settings seeded');
  }

  // 3. Seed Website Sections
  const sectionsCheck = db.prepare('SELECT COUNT(*) as count FROM website_sections').get();
  if (sectionsCheck.count === 0) {
    const defaultSections = [
      {
        section_key: 'hero',
        title: 'Capturing Meaningful Moments.',
        subtitle: 'AF Frame Creative Production',
        description: 'Photography, film, and visual storytelling for moments that matter. Menghadirkan rekaman visual berestetika tinggi yang siap tayang di media sosial dan abadi sepanjang masa.',
        cta_primary_text: 'Lihat Paket & Harga',
        cta_primary_url: '#packages',
        cta_secondary_text: 'Konsultasi Project',
        cta_secondary_url: '#booking',
        background_media_url: 'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=2070&auto=format&fit=crop',
        background_type: 'image',
        overlay_opacity: 65,
        focal_point: 'center',
        text_alignment: 'center',
        theme: 'dark',
        is_visible: 1,
        sort_order: 1
      },
      {
        section_key: 'selected_works',
        title: 'Selected Works',
        subtitle: 'Karya Pilihan AF Frame',
        description: 'Setiap bingkai menceritakan emosi murni, kehangatan perayaan, dan visi artistik yang tak lekang oleh waktu.',
        cta_primary_text: 'Jelajahi Portofolio Lengkap',
        cta_primary_url: '/portfolio',
        cta_secondary_text: '',
        cta_secondary_url: '',
        background_media_url: '',
        background_type: 'none',
        overlay_opacity: 0,
        focal_point: 'center',
        text_alignment: 'left',
        theme: 'dark',
        is_visible: 1,
        sort_order: 2
      },
      {
        section_key: 'about',
        title: 'Tentang Kami',
        subtitle: 'Cerita di Balik Lensa AF Frame',
        description: 'AF Frame adalah layanan content creator dan dokumentasi moment yang berfokus pada mengabadikan momen spesial dalam bentuk foto, video cinematic, dan konten media sosial. Dari perayaan personal hingga kebutuhan dokumentasi perusahaan, setiap karya menjadi bagian dari cerita yang layak dikenang.',
        cta_primary_text: 'Konsultasikan Kebutuhan',
        cta_primary_url: '#booking',
        cta_secondary_text: '',
        cta_secondary_url: '',
        background_media_url: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?q=80&w=2070&auto=format&fit=crop',
        background_type: 'image',
        overlay_opacity: 85,
        focal_point: 'center',
        text_alignment: 'left',
        theme: 'dark',
        is_visible: 1,
        sort_order: 3
      },
      {
        section_key: 'why_us',
        title: 'Kenapa Kami?',
        subtitle: 'Standar Kualitas AF Frame',
        description: '5 Alasan mengapa ratusan momen berharga dipercayakan pada tim visual AF Frame.',
        cta_primary_text: '',
        cta_primary_url: '',
        cta_secondary_text: '',
        cta_secondary_url: '',
        background_media_url: '',
        background_type: 'none',
        overlay_opacity: 0,
        focal_point: 'center',
        text_alignment: 'center',
        theme: 'dark',
        is_visible: 1,
        sort_order: 4
      },
      {
        section_key: 'services',
        title: 'Layanan Kreatif',
        subtitle: 'Spesialisasi Produksi Visual',
        description: 'Layanan terintegrasi mulai dari fotografi resolusi tinggi, video cinematic storytelling, hingga konten real-time untuk kebutuhan personal dan brand.',
        cta_primary_text: '',
        cta_primary_url: '',
        cta_secondary_text: '',
        cta_secondary_url: '',
        background_media_url: '',
        background_type: 'none',
        overlay_opacity: 0,
        focal_point: 'center',
        text_alignment: 'left',
        theme: 'dark',
        is_visible: 0,
        sort_order: 5
      },
      {
        section_key: 'packages',
        title: 'Pilihan Paket & Investasi',
        subtitle: 'Katalog Resmi AF Frame',
        description: 'Pilihan paket fleksibel, transparan, dan terarah dengan penawaran harga spesial untuk mengabadikan momen terbaik Anda.',
        cta_primary_text: 'Pesan Sekarang',
        cta_primary_url: '#booking',
        cta_secondary_text: '',
        cta_secondary_url: '',
        background_media_url: '',
        background_type: 'none',
        overlay_opacity: 0,
        focal_point: 'center',
        text_alignment: 'center',
        theme: 'dark',
        is_visible: 1,
        sort_order: 6
      },
      {
        section_key: 'publication',
        title: 'Portfolio & Publication',
        subtitle: 'Komitmen & Karya Kami',
        description: 'Setiap karya yang kami hasilkan menjadi bagian dari perjalanan AF Frame dan dapat digunakan untuk kebutuhan portofolio, publikasi, serta pengembangan brand melalui berbagai media.',
        cta_primary_text: 'Ikuti @_afframe di Instagram',
        cta_primary_url: 'https://www.instagram.com/_afframe/',
        cta_secondary_text: '',
        cta_secondary_url: '',
        background_media_url: '',
        background_type: 'none',
        overlay_opacity: 0,
        focal_point: 'center',
        text_alignment: 'center',
        theme: 'dark',
        is_visible: 1,
        sort_order: 7
      },
      {
        section_key: 'service_areas',
        title: 'Jangkauan Wilayah',
        subtitle: 'Lokasi & Coverage Area',
        description: 'Kami melayani dokumentasi langsung di lokasi acara Anda dengan mobilitas tinggi.',
        cta_primary_text: 'Tanyakan Coverage Wilayah Anda',
        cta_primary_url: '#booking',
        cta_secondary_text: '',
        cta_secondary_url: '',
        background_media_url: '',
        background_type: 'none',
        overlay_opacity: 0,
        focal_point: 'center',
        text_alignment: 'center',
        theme: 'dark',
        is_visible: 1,
        sort_order: 8
      },
      {
        section_key: 'faq',
        title: 'Pertanyaan Umum',
        subtitle: 'Frequently Asked Questions',
        description: 'Informasi lengkap dan transparan mengenai alur pemesanan, teknis sesi, dan pengiriman file.',
        cta_primary_text: 'Punya Pertanyaan Lain?',
        cta_primary_url: 'https://wa.me/6285755152579',
        cta_secondary_text: '',
        cta_secondary_url: '',
        background_media_url: '',
        background_type: 'none',
        overlay_opacity: 0,
        focal_point: 'center',
        text_alignment: 'left',
        theme: 'dark',
        is_visible: 1,
        sort_order: 9
      },
      {
        section_key: 'terms',
        title: 'Syarat & Ketentuan (S&K)',
        subtitle: 'Ketentuan Layanan',
        description: 'Kebijakan resmi operasional AF Frame demi kenyamanan dan kelancaran kerja sama dokumentasi.',
        cta_primary_text: '',
        cta_primary_url: '',
        cta_secondary_text: '',
        cta_secondary_url: '',
        background_media_url: '',
        background_type: 'none',
        overlay_opacity: 0,
        focal_point: 'center',
        text_alignment: 'center',
        theme: 'dark',
        is_visible: 1,
        sort_order: 10
      },
      {
        section_key: 'booking_cta',
        title: 'Kunci Tanggal & Diskusikan Project Anda',
        subtitle: 'Reservasi & Inquiry',
        description: 'Isi formulir singkat di bawah ini. Data Anda akan langsung tersimpan dan terhubung ke WhatsApp AF Frame dengan rincian yang rapi.',
        cta_primary_text: 'Kirim Inquiry Sekarang',
        cta_primary_url: '#booking-form',
        cta_secondary_text: 'WhatsApp Langsung',
        cta_secondary_url: 'https://wa.me/6285755152579',
        background_media_url: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=2069&auto=format&fit=crop',
        background_type: 'image',
        overlay_opacity: 75,
        focal_point: 'center',
        text_alignment: 'center',
        theme: 'dark',
        is_visible: 1,
        sort_order: 11
      }
    ];

    const insertSection = db.prepare(`
      INSERT INTO website_sections (
        section_key, title, subtitle, description, cta_primary_text, cta_primary_url,
        cta_secondary_text, cta_secondary_url, background_media_url, background_type,
        overlay_opacity, focal_point, text_alignment, theme, is_visible, sort_order
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const sec of defaultSections) {
      insertSection.run(
        sec.section_key, sec.title, sec.subtitle, sec.description,
        sec.cta_primary_text, sec.cta_primary_url, sec.cta_secondary_text, sec.cta_secondary_url,
        sec.background_media_url, sec.background_type, sec.overlay_opacity, sec.focal_point,
        sec.text_alignment, sec.theme, sec.is_visible, sec.sort_order
      );
    }
    console.log('[Seed] Website sections seeded');
  }

  // 4. Seed Navigation Items
  const navCheck = db.prepare('SELECT COUNT(*) as count FROM navigation_items').get();
  if (navCheck.count === 0) {
    const navItems = [
      { label: 'Portofolio', url: '/portfolio', location: 'header', sort_order: 1 },
      { label: 'Tentang Kami', url: '/#about', location: 'header', sort_order: 2 },
      { label: 'Kenapa Kami', url: '/#why_us', location: 'header', sort_order: 3 },
      { label: 'Paket & Harga', url: '/services', location: 'header', sort_order: 4 },
      { label: 'Coverage', url: '/#service_areas', location: 'header', sort_order: 5 },
      { label: 'S&K', url: '/terms', location: 'header', sort_order: 6 },
      { label: 'FAQ', url: '/#faq', location: 'header', sort_order: 7 },
      { label: 'Booking', url: '/contact', location: 'header', sort_order: 8 },

      // Footer items
      { label: 'Portofolio Lengkap', url: '/portfolio', location: 'footer', sort_order: 1 },
      { label: 'Daftar Layanan & Paket', url: '/services', location: 'footer', sort_order: 2 },
      { label: 'Tentang AF Frame', url: '/about', location: 'footer', sort_order: 3 },
      { label: 'Syarat & Ketentuan', url: '/terms', location: 'footer', sort_order: 4 },
      { label: 'Kebijakan Privasi', url: '/privacy', location: 'footer', sort_order: 5 },
      { label: 'Kontak & Reservasi', url: '/contact', location: 'footer', sort_order: 6 }
    ];

    const insertNav = db.prepare(`
      INSERT INTO navigation_items (label, url, target, location, is_visible, sort_order)
      VALUES (?, ?, '_self', ?, 1, ?)
    `);
    for (const item of navItems) {
      insertNav.run(item.label, item.url, item.location, item.sort_order);
    }
    console.log('[Seed] Navigation items seeded');
  }

  // 5. Seed Portfolio Categories
  const catCheck = db.prepare('SELECT COUNT(*) as count FROM portfolio_categories').get();
  if (catCheck.count === 0) {
    const categories = [
      { name: 'Corporate', slug: 'corporate', description: 'Dokumentasi profesional seminar, gathering korporasi, product launch, dan aktivitas institusi.', cover: 'https://images.unsplash.com/photo-1511578314322-379afb476865?q=80&w=1200&auto=format&fit=crop', sort_order: 1 },
      { name: 'Graduation', slug: 'graduation', description: 'Abadikan pencapaian bersejarah wisuda dengan gaya elegan, hangat, dan berkarakter.', cover: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=1200&auto=format&fit=crop', sort_order: 2 },
      { name: 'Wedding & Event', slug: 'wedding-event', description: 'Dokumentasi pernikahan, lamaran, intimate gathering & celebration penuh kehangatan emosi.', cover: 'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1200&auto=format&fit=crop', sort_order: 3 },
      { name: 'Creative Content', slug: 'creative-content', description: 'Short film, cinematic reels, storytelling edit, dan video tren media sosial yang impactful.', cover: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?q=80&w=1200&auto=format&fit=crop', sort_order: 4 },
      { name: 'Personal Branding', slug: 'personal-branding', description: 'Portret profesional dan video konten personal untuk menguatkan reputasi dan otoritas Anda.', cover: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=1200&auto=format&fit=crop', sort_order: 5 },
      { name: 'Tour & Travel', slug: 'tour-travel', description: 'Perjalanan berkesan yang didokumentasikan dengan landscape sinematik dan footage drone berkelas.', cover: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?q=80&w=1200&auto=format&fit=crop', sort_order: 6 }
    ];

    const insertCat = db.prepare(`
      INSERT INTO portfolio_categories (name, slug, description, cover_image_url, thumbnail_url, is_visible, sort_order)
      VALUES (?, ?, ?, ?, ?, 1, ?)
    `);
    for (const c of categories) {
      insertCat.run(c.name, c.slug, c.description, c.cover, c.cover, c.sort_order);
    }
    console.log('[Seed] Portfolio categories seeded');
  }

  // 6. Seed Portfolio Projects & Gallery Images
  const projCheck = db.prepare('SELECT COUNT(*) as count FROM portfolio_projects').get();
  if (projCheck.count === 0) {
    const projects = [
      {
        category_slug: 'wedding-event',
        title: 'Intimate Sacred Union — Arya & Nadhira',
        slug: 'intimate-sacred-union-arya-nadhira',
        short_description: 'Dokumentasi prosesi akad dan resepsi intim dengan sentuhan cinematic warm tones di Surabaya Barat.',
        full_description: 'Sesi dokumentasi pernikahan intim yang memadukan kehangatan tradisi dengan estetika visual modern. Menggabungkan dokumentasi candid tanpa menginterupsi kesakralan acara, serta rekaman cinematic video recap yang menyentuh emosi.',
        client_name: 'Arya & Nadhira',
        project_date: '2026-02-14',
        location: 'Surabaya, Jawa Timur',
        cover_image_url: 'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1200&auto=format&fit=crop',
        featured_video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        is_featured: 1,
        sort_order: 1,
        images: [
          'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1200&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=1200&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1583939003579-730e3918a45a?q=80&w=1200&auto=format&fit=crop'
        ]
      },
      {
        category_slug: 'graduation',
        title: 'The Triumphant Milestone — Universitas Airlangga',
        slug: 'triumphant-milestone-unair',
        short_description: 'Sesi wisuda penuh kebanggaan bersama keluarga dan sahabat dengan pose terarah alami.',
        full_description: 'Momen perayaan kelulusan gelar Sarjana Kedokteran di Kampus UNAIR. Sesi 2 jam dengan bantuan arahan pose rileks, menghasilkan foto berkarakter editorial serta bonus video cinematic 60 detik untuk Instagram Reels.',
        client_name: 'dr. Farhan & Rekan',
        project_date: '2026-01-20',
        location: 'Kampus C UNAIR, Surabaya',
        cover_image_url: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=1200&auto=format&fit=crop',
        featured_video_url: '',
        is_featured: 1,
        sort_order: 2,
        images: [
          'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=1200&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1627556704290-2b1f5853ff78?q=80&w=1200&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=1200&auto=format&fit=crop'
        ]
      },
      {
        category_slug: 'corporate',
        title: 'Annual Leadership Summit — East Java Energy Corp',
        slug: 'annual-leadership-summit-east-java-energy',
        short_description: 'Dokumentasi konferensi bisnis tahunan, live real-time coverage, serta video recap sinematik.',
        full_description: 'Liputan menyeluruh perhelatan korporasi selama 1 hari penuh. Tim 3 personil mengoperasikan kamera utama beresolusi tinggi, drone aerial untuk arsitektur gedung, dan live report stories untuk feed korporasi.',
        client_name: 'PT East Java Energy Corp',
        project_date: '2026-02-05',
        location: 'Gresik Grand Ballroom',
        cover_image_url: 'https://images.unsplash.com/photo-1511578314322-379afb476865?q=80&w=1200&auto=format&fit=crop',
        featured_video_url: '',
        is_featured: 1,
        sort_order: 3,
        images: [
          'https://images.unsplash.com/photo-1511578314322-379afb476865?q=80&w=1200&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?q=80&w=1200&auto=format&fit=crop'
        ]
      },
      {
        category_slug: 'creative-content',
        title: 'Verve Atelier: The Craft of Tailoring Short Film',
        slug: 'verve-atelier-short-film',
        short_description: 'Produksi video brand narrative dengan sinematografi anamorfik dan sound design mendalam.',
        full_description: 'Eksplorasi visual proses pembuatan jas bespoke. Menyorot ketelitian jahitan, tekstur bahan wol, dan dedikasi pengrajin dalam balutan tone warna cinematic warm vintage.',
        client_name: 'Verve Atelier',
        project_date: '2026-01-10',
        location: 'Surabaya Design District',
        cover_image_url: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?q=80&w=1200&auto=format&fit=crop',
        featured_video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        is_featured: 1,
        sort_order: 4,
        images: [
          'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?q=80&w=1200&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1200&auto=format&fit=crop'
        ]
      },
      {
        category_slug: 'personal-branding',
        title: 'Executive Portraiture & Content — Nadia Wirawan',
        slug: 'executive-portraiture-nadia-wirawan',
        short_description: 'Sesi personal branding untuk keynote speaker dan konsultan bisnis dengan arahan gaya modern.',
        full_description: 'Pengambilan foto portret studio dan lifestyle modern untuk profil media, LinkedIn, dan materi publikasi buku. Termasuk 2 video recap tren untuk TikTok & Instagram profesional.',
        client_name: 'Nadia Wirawan, M.B.A',
        project_date: '2026-02-18',
        location: 'Lamongan Executive Suites',
        cover_image_url: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=1200&auto=format&fit=crop',
        featured_video_url: '',
        is_featured: 0,
        sort_order: 5,
        images: [
          'https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=1200&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=1200&auto=format&fit=crop'
        ]
      },
      {
        category_slug: 'tour-travel',
        title: 'Whispers of Mount Bromo & Beyond Expedition',
        slug: 'whispers-of-mount-bromo-expedition',
        short_description: 'Dokumentasi ekspedisi lanskap Bromo dengan footage drone cinematic dan live story reportage.',
        full_description: 'Perjalanan 3 hari mendokumentasikan keagungan lautan pasir dan sunrise Bromo untuk rombongan traveler internasional. Dilengkapi video dokumenter berdurasi 3 menit dan ratusan foto high-res pilihan.',
        client_name: 'Wanderlust Nusantara Tour',
        project_date: '2026-01-28',
        location: 'Taman Nasional Bromo Tengger Semeru',
        cover_image_url: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?q=80&w=1200&auto=format&fit=crop',
        featured_video_url: '',
        is_featured: 1,
        sort_order: 6,
        images: [
          'https://images.unsplash.com/photo-1488646953014-85cb44e25828?q=80&w=1200&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=1200&auto=format&fit=crop'
        ]
      }
    ];

    const getCat = db.prepare('SELECT id FROM portfolio_categories WHERE slug = ?');
    const insertProj = db.prepare(`
      INSERT INTO portfolio_projects (
        category_id, title, slug, short_description, full_description, client_name,
        project_date, location, cover_image_url, featured_video_url, is_featured, is_published,
        sort_order, seo_title, seo_description
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)
    `);
    const insertImg = db.prepare(`
      INSERT INTO portfolio_images (project_id, image_url, caption, sort_order)
      VALUES (?, ?, ?, ?)
    `);

    for (const p of projects) {
      const cat = getCat.get(p.category_slug);
      const catId = cat ? cat.id : null;
      const res = insertProj.run(
        catId, p.title, p.slug, p.short_description, p.full_description,
        p.client_name, p.project_date, p.location, p.cover_image_url,
        p.featured_video_url, p.is_featured, p.sort_order,
        `${p.title} — AF Frame Portfolio`, p.short_description
      );
      const projectId = res.lastInsertRowid;
      let imgOrder = 1;
      for (const img of p.images) {
        insertImg.run(projectId, img, p.title, imgOrder++);
      }
    }
    console.log('[Seed] Portfolio projects and gallery images seeded');
  }

  // 7. Seed Services and Packages (EXACT FROM AF FRAME CATALOG)
  const servCheck = db.prepare('SELECT COUNT(*) as count FROM services').get();
  if (servCheck.count === 0) {
    const servicesData = [
      {
        name: 'Graduation Photography & Videography',
        slug: 'graduation',
        short_description: 'Dokumentasi kelulusan berkarakter editorial dengan pose terarah dan bonus video sinematik.',
        icon_name: 'GraduationCap',
        cover: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=1200&auto=format&fit=crop',
        sort_order: 1,
        packages: [
          {
            package_name: 'GOLD',
            regular_price: 350000,
            promotional_price: 250000,
            duration: '1 jam',
            deliverables: [
              'Durasi 1 jam sesi',
              '20 foto terbaik yang sudah diedit',
              'Free all documentation files (original)',
              'Bonus 1 video cinematic 30–90 detik',
              'Unlimited shoot high resolution',
              'Bantuan arahan pose selama sesi',
              'File dikirim via Google Drive (aktif 1 bulan)'
            ],
            is_featured: 0,
            sort_order: 1
          },
          {
            package_name: 'DIAMOND',
            regular_price: 450000,
            promotional_price: 350000,
            duration: '2 jam',
            deliverables: [
              'Durasi 2 jam sesi',
              '30 foto terbaik yang sudah diedit',
              'Free all documentation files (original)',
              'Bonus 2 video cinematic 30–120 detik (bisa request konsep)',
              'Unlimited shoot high resolution',
              'Bantuan arahan pose selama sesi',
              'File dikirim via Google Drive (aktif 1 bulan)'
            ],
            is_featured: 1,
            sort_order: 2
          }
        ]
      },
      {
        name: 'Wedding, Gathering, Engagement & Event',
        slug: 'wedding-event',
        short_description: 'Dokumentasi momen sakral & perayaan spesial dengan real-time Instagram stories dan color grading premium.',
        icon_name: 'HeartHandshake',
        cover: 'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1200&auto=format&fit=crop',
        sort_order: 2,
        packages: [
          {
            package_name: 'GOLD',
            regular_price: 400000,
            promotional_price: 300000,
            duration: '3 jam standby',
            deliverables: [
              '3 jam standby di lokasi',
              '5 Instagram stories real-time (opsional)',
              '1 video recap 30–90 detik',
              '1 video reels Instagram / TikTok Trend',
              'Color Grading & Audio Enhancement',
              'Creative Direction selama sesi',
              'Unlimited shoot high resolution',
              'Free all file footage via Google Drive (1 bulan)'
            ],
            is_featured: 0,
            sort_order: 1
          },
          {
            package_name: 'DIAMOND',
            regular_price: 600000,
            promotional_price: 500000,
            duration: '8 jam standby',
            deliverables: [
              '8 jam standby di lokasi acara',
              '15 Instagram stories real-time (opsional)',
              '2 video recap 30–120 detik',
              '3 video reels Instagram / TikTok Trend',
              'Color Grading & Audio Enhancement',
              'Creative Direction selama sesi',
              'Unlimited shoot high resolution',
              'Free all file footage via Google Drive (1 bulan)'
            ],
            is_featured: 1,
            sort_order: 2
          }
        ]
      },
      {
        name: 'Creative Content, Cinematic & Short Film',
        slug: 'creative-content',
        short_description: 'Produksi video bercerita, visual storytelling, dan konten siap tayang media sosial dengan estetika sinema.',
        icon_name: 'Film',
        cover: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?q=80&w=1200&auto=format&fit=crop',
        sort_order: 3,
        packages: [
          {
            package_name: 'GOLD',
            regular_price: 500000,
            promotional_price: 350000,
            duration: '±1 jam shooting',
            deliverables: [
              'Durasi shooting ±1 jam',
              '1 cinematic video (30–90 detik)',
              'Konsep visual sederhana',
              'Pengambilan footage cinematic',
              'Basic storytelling editing',
              'Color tone cinematic signature',
              'Konten siap upload ke Reels / TikTok',
              'Unlimited raw footage',
              'File dikirim via Google Drive (1 bulan)'
            ],
            is_featured: 0,
            sort_order: 1
          },
          {
            package_name: 'DIAMOND',
            regular_price: 700000,
            promotional_price: 500000,
            duration: '±2 jam shooting',
            deliverables: [
              'Durasi shooting ±2 jam',
              '1 cinematic video (1–3 menit)',
              '1 fun / trend video (Reels / TikTok)',
              'Konsep konten lebih fleksibel',
              'Cinematic shooting style',
              'Storytelling editing mendalam',
              'Cinematic color grading premium',
              'Konten siap upload ke Instagram & TikTok',
              'Unlimited raw footage',
              'File dikirim via Google Drive (1 bulan)'
            ],
            is_featured: 1,
            sort_order: 2
          }
        ]
      },
      {
        name: 'Personal Branding Content',
        slug: 'personal-branding',
        short_description: 'Bangun persona profesional berdaya pikat tinggi dengan potret eksklusif dan video tren berbobot.',
        icon_name: 'UserCheck',
        cover: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=1200&auto=format&fit=crop',
        sort_order: 4,
        packages: [
          {
            package_name: 'GOLD',
            regular_price: 500000,
            promotional_price: 280000,
            duration: '3 jam standby',
            deliverables: [
              '3 jam standby',
              '1 video recap',
              '1 video trend (TikTok / Instagram) by request',
              'Color Grading & Audio Enhancement',
              'Creative Direction selama sesi',
              '1x revisi minor',
              'Bonus 10 foto dokumentasi (edited)',
              'Unlimited shoot high resolution',
              'Free all file footage via Google Drive (1 bulan)'
            ],
            is_featured: 0,
            sort_order: 1
          },
          {
            package_name: 'DIAMOND',
            regular_price: 700000,
            promotional_price: 450000,
            duration: '8 jam standby',
            deliverables: [
              '8 jam standby',
              '2 video recap',
              '3 video trend (TikTok / Instagram) by request',
              'Color Grading & Audio Enhancement',
              'Creative Direction selama sesi',
              '2x revisi minor',
              'Bonus 20 foto dokumentasi (edited)',
              'Unlimited shoot high resolution',
              'Free all file footage via Google Drive (1 bulan)'
            ],
            is_featured: 1,
            sort_order: 2
          }
        ]
      },
      {
        name: 'Corporate Event Documentation Profesional',
        slug: 'corporate-event',
        short_description: 'Dokumentasi lengkap foto beresolusi tinggi, video portrait & landscape, serta opsi drone udara untuk instansi.',
        icon_name: 'Building2',
        cover: 'https://images.unsplash.com/photo-1511578314322-379afb476865?q=80&w=1200&auto=format&fit=crop',
        sort_order: 5,
        packages: [
          {
            package_name: 'STANDART',
            regular_price: 2000000,
            promotional_price: 1800000,
            duration: 'Full event',
            deliverables: [
              'Dokumentasi foto selama acara',
              '1 Video Recap Portrait (Instagram Reels / TikTok)',
              '1 Video Recap Landscape (YouTube / Event Documentation)',
              'Seluruh file foto hasil seleksi',
              'Color correction & basic retouch',
              'Color grading video profesional',
              '1x revisi minor',
              'Tim dokumentasi (2 orang)',
              'Estimasi pengerjaan 1 hari kerja',
              'Pengiriman file via Google Drive'
            ],
            is_featured: 0,
            sort_order: 1
          },
          {
            package_name: 'DIAMOND',
            regular_price: 7000000,
            promotional_price: 3800000,
            duration: 'Full event',
            deliverables: [
              'Dokumentasi foto selama acara',
              '1 Video Recap Portrait (Instagram Reels / TikTok)',
              '1 Video Recap Landscape (YouTube / Event Documentation)',
              'Live report Instagram stories real-time max 15 (takeover account opsional)',
              'Drone Aerial Cinematic Footage',
              'Premium Color Grading',
              'Seluruh file foto hasil seleksi',
              'Color correction & basic retouch',
              '2x revisi minor',
              'Tim dokumentasi (3 orang)',
              'Estimasi pengerjaan 1 hari kerja',
              'Pengiriman file via Google Drive'
            ],
            is_featured: 1,
            sort_order: 2
          }
        ]
      },
      {
        name: 'Tour & Travel Documentation',
        slug: 'tour-travel',
        short_description: 'Dokumentasi perjalanan wisata berkelas dengan tim komplit, drone aerial, dan video landscape berkualitas tinggi.',
        icon_name: 'Compass',
        cover: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?q=80&w=1200&auto=format&fit=crop',
        sort_order: 6,
        packages: [
          {
            package_name: 'DIAMOND',
            regular_price: 7000000,
            promotional_price: 4800000,
            duration: 'Trip duration',
            deliverables: [
              'Dokumentasi foto selama perjalanan & acara',
              '1 Video Recap Portrait (Instagram Reels / TikTok)',
              '1 Video Recap Landscape (YouTube / Reels / Travel Documentation)',
              'Live report Instagram stories real-time max 15 (takeover account opsional)',
              'Drone Aerial Cinematic Footage',
              'Premium Color Grading',
              'Seluruh file foto hasil seleksi',
              'Color correction & basic retouch',
              '2x revisi minor',
              'Tim dokumentasi (3 orang)',
              'Estimasi pengerjaan 3 hari kerja',
              'Pengiriman file via Google Drive'
            ],
            is_featured: 1,
            sort_order: 1
          }
        ]
      }
    ];

    const insertService = db.prepare(`
      INSERT INTO services (name, slug, short_description, icon_name, cover_image_url, is_visible, sort_order)
      VALUES (?, ?, ?, ?, ?, 1, ?)
    `);
    const insertPackage = db.prepare(`
      INSERT INTO service_packages (
        service_id, category_name, package_name, regular_price, promotional_price,
        is_price_hidden, is_quotation_based, duration, deliverables_json, inclusions_json,
        is_featured, is_published, sort_order
      ) VALUES (?, ?, ?, ?, ?, 0, 0, ?, ?, '[]', ?, 1, ?)
    `);

    for (const s of servicesData) {
      const sRes = insertService.run(s.name, s.slug, s.short_description, s.icon_name, s.cover, s.sort_order);
      const serviceId = sRes.lastInsertRowid;
      for (const p of s.packages) {
        insertPackage.run(
          serviceId, s.name, p.package_name, p.regular_price, p.promotional_price,
          p.duration, JSON.stringify(p.deliverables), p.is_featured, p.sort_order
        );
      }
    }
    console.log('[Seed] Services and packages seeded from catalog');
  }

  // 8. Seed Kenapa Kami (Benefits)
  const benCheck = db.prepare('SELECT COUNT(*) as count FROM benefits').get();
  if (benCheck.count === 0) {
    const defaultBenefits = [
      {
        title: 'Natural Moment',
        description: 'Menangkap momen yang tulus dan jujur tanpa kekakuan. Emosi nyata, senyum spontan, dan interaksi hangat yang abadi.',
        icon_name: 'Sparkles',
        sort_order: 1
      },
      {
        title: 'Social Media Ready',
        description: 'Format foto dan video vertikal berkualitas tinggi yang langsung siap dibagikan ke Instagram Reels, TikTok, maupun Stories.',
        icon_name: 'Share2',
        sort_order: 2
      },
      {
        title: 'Bonus Cinematic Video',
        description: 'Sentuhan visual berkelas ala sinema dengan gradasi warna khas yang menyulap momen Anda menjadi karya bernilai tinggi.',
        icon_name: 'Video',
        sort_order: 3
      },
      {
        title: 'Fast Delivery',
        description: 'Proses seleksi, editing, dan pengiriman file cepat melalui cloud Google Drive agar Anda segera menikmati hasil karya.',
        icon_name: 'Zap',
        sort_order: 4
      },
      {
        title: 'Flexible Service',
        description: 'Layanan adaptif yang dapat disesuaikan dengan konsep acara, rundown spesifik, serta kebutuhan personal maupun korporasi.',
        icon_name: 'ShieldCheck',
        sort_order: 5
      }
    ];

    const insertBen = db.prepare(`
      INSERT INTO benefits (title, description, icon_name, is_visible, sort_order)
      VALUES (?, ?, ?, 1, ?)
    `);
    for (const b of defaultBenefits) {
      insertBen.run(b.title, b.description, b.icon_name, b.sort_order);
    }
    console.log('[Seed] Benefits seeded');
  }

  // 9. Seed Syarat & Ketentuan (Exact Catalog Page 3)
  const termsCheck = db.prepare('SELECT COUNT(*) as count FROM terms_content').get();
  if (termsCheck.count === 0) {
    const termsData = [
      {
        title: 'Konfirmasi Booking & Pelunasan',
        clause_number: 1,
        clause_text: 'Booking dikonfirmasi setelah DP 50% dibayarkan. Pelunasan dilakukan sebelum layanan dimulai.',
        sort_order: 1
      },
      {
        title: 'Kebijakan Pembatalan',
        clause_number: 2,
        clause_text: 'DP yang telah dibayarkan tidak dapat dikembalikan apabila terjadi pembatalan dari pihak klien.',
        sort_order: 2
      },
      {
        title: 'Perubahan Jadwal (Rescheduling)',
        clause_number: 3,
        clause_text: 'Perubahan jadwal dapat diajukan dan menyesuaikan ketersediaan jadwal AF Frame.',
        sort_order: 3
      },
      {
        title: 'Penambahan Di Luar Paket',
        clause_number: 4,
        clause_text: 'Penambahan durasi, layanan, output, transportasi, atau kebutuhan khusus di luar paket dapat dikenakan biaya tambahan.',
        sort_order: 4
      },
      {
        title: 'Hasil Dokumentasi & Waktu Pengerjaan',
        clause_number: 5,
        clause_text: 'Hasil dokumentasi diberikan sesuai paket, output, dan estimasi waktu pengerjaan yang telah ditentukan.',
        sort_order: 5
      },
      {
        title: 'Hak Publikasi & Portofolio',
        clause_number: 6,
        clause_text: 'Karya yang dihasilkan dapat digunakan AF Frame sebagai portofolio dan materi publikasi/promosi melalui media sosial, website, maupun media lainnya.',
        sort_order: 6
      },
      {
        title: 'Persetujuan Ketentuan',
        clause_number: 7,
        clause_text: 'Dengan melakukan pembayaran DP, klien dianggap telah membaca, memahami, dan menyetujui ketentuan AF Frame.',
        sort_order: 7
      }
    ];

    const insertTerm = db.prepare(`
      INSERT INTO terms_content (title, clause_number, clause_text, is_published, sort_order)
      VALUES (?, ?, ?, 1, ?)
    `);
    for (const t of termsData) {
      insertTerm.run(t.title, t.clause_number, t.clause_text, t.sort_order);
    }
    console.log('[Seed] Terms & Conditions seeded');
  }

  // 10. Seed FAQ Items
  const faqCheck = db.prepare('SELECT COUNT(*) as count FROM faq_items').get();
  if (faqCheck.count === 0) {
    const defaultFaqs = [
      {
        question: 'Bagaimana cara melakukan booking sesi di AF Frame?',
        answer: 'Pilih paket yang Anda inginkan pada website, isi formulir inquiry atau klik tombol booking. Sistem akan otomatis menyiapkan ringkasan pemesanan dan mengarahkan Anda ke WhatsApp resmi AF Frame untuk konfirmasi slot tanggal.',
        category: 'booking',
        sort_order: 1
      },
      {
        question: 'Berapa besaran Down Payment (DP) untuk mengunci jadwal?',
        answer: 'Sesuai ketentuan, booking dianggap resmi terkonfirmasi setelah pembayaran DP sebesar 50%. Pelunasan biaya sisa dilakukan sebelum sesi dokumentasi dimulai.',
        category: 'booking',
        sort_order: 2
      },
      {
        question: 'Apakah bisa mengajukan perubahan jadwal (reschedule)?',
        answer: 'Bisa. Perubahan jadwal dapat diajukan dengan memberitahu tim kami sesegera mungkin dan akan disesuaikan dengan ketersediaan slot jadwal AF Frame yang masih kosong.',
        category: 'booking',
        sort_order: 3
      },
      {
        question: 'Berapa lama estimasi pengiriman hasil foto & video?',
        answer: 'Untuk paket graduation dan event, seluruh file original dibagikan via Google Drive segera setelah sesi, sedangkan hasil edit dan cinematic video selesai dalam 1-3 hari kerja tergantung paket yang dipilih.',
        category: 'deliverables',
        sort_order: 4
      },
      {
        question: 'Apakah bisa request paket kustom (custom package)?',
        answer: 'Tentu. Anda dapat berkonsultasi langsung melalui WhatsApp untuk menyesuaikan durasi waktu, jumlah kru, konsep video recap, atau kebutuhan khusus lainnya di luar katalog standar.',
        category: 'packages',
        sort_order: 5
      },
      {
        question: 'Bagaimana jika ada penambahan durasi saat acara berlangsung?',
        answer: 'Penambahan durasi, jumlah output video/foto, atau transportasi di luar paket dapat difasilitasi dan akan dikenakan penyesuaian biaya tambahan sesuai kesepakatan.',
        category: 'event',
        sort_order: 6
      },
      {
        question: 'Apakah AF Frame melayani dokumentasi di luar area Lamongan, Gresik, dan Surabaya?',
        answer: 'Ya, tim AF Frame siap bertolak ke kota-kota lain di Jawa Timur dan seluruh Indonesia berdasarkan permintaan dan kesepakatan akomodasi.',
        category: 'coverage',
        sort_order: 7
      },
      {
        question: 'Apakah hasil karya akan dijadikan portofolio publikasi?',
        answer: 'Sesuai dengan ketentuan kami, setiap karya yang dihasilkan dapat digunakan AF Frame untuk materi portofolio, publikasi sosial media, dan pengembangan brand melalui berbagai media.',
        category: 'general',
        sort_order: 8
      }
    ];

    const insertFaq = db.prepare(`
      INSERT INTO faq_items (question, answer, category, is_published, sort_order)
      VALUES (?, ?, ?, 1, ?)
    `);
    for (const f of defaultFaqs) {
      insertFaq.run(f.question, f.answer, f.category, f.sort_order);
    }
    console.log('[Seed] FAQs seeded');
  }

  // 11. Seed Service Areas
  const areaCheck = db.prepare('SELECT COUNT(*) as count FROM service_areas').get();
  if (areaCheck.count === 0) {
    const areas = [
      {
        name: 'Lamongan',
        description: 'Pusat operasional utama AF Frame. Siap melayani dokumentasi event, wedding, graduation kampus, dan branding di seluruh area Lamongan kota dan sekitarnya.',
        image_url: 'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?q=80&w=800&auto=format&fit=crop',
        is_primary: 1,
        sort_order: 1
      },
      {
        name: 'Gresik',
        description: 'Layanan dokumentasi untuk kawasan industri, korporasi, pernikahan gedung, serta gathering komunitas di wilayah Gresik dan sekitarnya.',
        image_url: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=800&auto=format&fit=crop',
        is_primary: 1,
        sort_order: 2
      },
      {
        name: 'Surabaya',
        description: 'Cakupan penuh untuk Surabaya Barat, Timur, Pusat, Selatan, dan Utara. Melayani wisuda UNAIR, ITS, UNESA, corporate summits, dan luxury weddings.',
        image_url: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=800&auto=format&fit=crop',
        is_primary: 1,
        sort_order: 3
      },
      {
        name: 'Area Lainnya (By Request)',
        description: 'Siap melakukan perjalanan dinas atau trip dokumentasi ke Malang, Sidoarjo, Mojokerto, Tuban, Bojonegoro, Bromo, hingga luar pulau Jawa.',
        image_url: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=800&auto=format&fit=crop',
        is_primary: 0,
        sort_order: 4
      }
    ];

    const insertArea = db.prepare(`
      INSERT INTO service_areas (name, description, image_url, is_primary, is_visible, sort_order)
      VALUES (?, ?, ?, ?, 1, ?)
    `);
    for (const a of areas) {
      insertArea.run(a.name, a.description, a.image_url, a.is_primary, a.sort_order);
    }
    console.log('[Seed] Service areas seeded');
  }

  // 12. Seed Sample Inquiries for admin preview
  const inqCheck = db.prepare('SELECT COUNT(*) as count FROM inquiries').get();
  if (inqCheck.count === 0) {
    const sampleInquiries = [
      {
        inquiry_code: 'AF-202602-001',
        full_name: 'Dwi Prasetyo',
        whatsapp_number: '081234567890',
        email: 'dwi.prasetyo@example.com',
        instagram_handle: '@dwiprasetyo',
        company: 'PT Petro Graha Indah',
        service_name: 'Corporate Event Documentation Profesional',
        package_name: 'STANDART',
        event_date: '2026-03-15',
        event_time: '09:00 WIB',
        location: 'Hotel Santika Gresik',
        budget_range: 'Rp 2.000.000 - Rp 3.000.000',
        additional_notes: 'Acara peluncuran cabang baru. Mohon 1 video reels untuk diposting hari yang sama.',
        status: 'quoted'
      },
      {
        inquiry_code: 'AF-202602-002',
        full_name: 'Alya Salsabila',
        whatsapp_number: '085678901234',
        email: 'alya.salsa@gmail.com',
        instagram_handle: '@alyasalsa_',
        company: '',
        service_name: 'Graduation Photography & Videography',
        package_name: 'DIAMOND',
        event_date: '2026-03-22',
        event_time: '13:00 WIB',
        location: 'Kampus C UNAIR Surabaya',
        budget_range: '< Rp 500.000',
        additional_notes: 'Sesi bersama orang tua dan 2 sahabat wisudawan.',
        status: 'new'
      }
    ];

    const insertInq = db.prepare(`
      INSERT INTO inquiries (
        inquiry_code, full_name, whatsapp_number, email, instagram_handle, company,
        service_name, package_name, event_date, event_time, location, budget_range,
        additional_notes, agreed_terms, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
    `);

    for (const inq of sampleInquiries) {
      insertInq.run(
        inq.inquiry_code, inq.full_name, inq.whatsapp_number, inq.email,
        inq.instagram_handle, inq.company, inq.service_name, inq.package_name,
        inq.event_date, inq.event_time, inq.location, inq.budget_range,
        inq.additional_notes, inq.status
      );
    }
    console.log('[Seed] Sample inquiries seeded');
  }
}

// Export database and initialization
module.exports = {
  db,
  initDatabase
};
