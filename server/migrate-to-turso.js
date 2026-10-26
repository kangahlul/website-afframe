const { createClient } = require('@libsql/client');
const Database = require('better-sqlite3');
const path = require('path');

const TURSO_URL = process.env.TURSO_DATABASE_URL || 'libsql://afframe-db-kangahlul.aws-ap-northeast-1.turso.io';
const TURSO_TOKEN = process.env.TURSO_AUTH_TOKEN || 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3OTMwMDQ1NzQsImlkIjoiMDFhMTc3NjUtMTEwMS03NzhkLTljNzQtMmM0OWU0MjJiNTUwIiwia2lkIjoiSkJqcHYtYXJqVHh0SEFXYkxNSGNyOV9qVlFQRVJ1ZFJBbEkxRGlUT2I5ZyIsInJpZCI6IjRmNDc1YTI4LWJhYWItNDc1YS04YzZiLTk2NDIxY2Q5MThhMiJ9.0BpV_sBctFhCDsHqQ8984xLEvRSwuLPpbqJVsK7tdeqReRGKNW4monbmD5PfXEODm6rCAXFGBj3pD2eZ8UzuAg';

async function migrate() {
  console.log('--- MIGRATING LOCAL SQLITE TO TURSO CLOUD ---');
  console.log('Target Turso DB:', TURSO_URL);

  const localDb = new Database(path.join(__dirname, 'data/afframe.db'));
  const turso = createClient({
    url: TURSO_URL,
    authToken: TURSO_TOKEN,
  });

  // Table DDLs
  const tableDefinitions = [
    `CREATE TABLE IF NOT EXISTS admin_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT DEFAULT 'admin',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS site_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT NOT NULL UNIQUE,
      value TEXT NOT NULL,
      type TEXT DEFAULT 'string',
      group_name TEXT DEFAULT 'general',
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS media_assets (
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
    )`,
    `CREATE TABLE IF NOT EXISTS website_sections (
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
    )`,
    `CREATE TABLE IF NOT EXISTS website_pages (
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
    )`,
    `CREATE TABLE IF NOT EXISTS navigation_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      label TEXT NOT NULL,
      url TEXT NOT NULL,
      target TEXT DEFAULT '_self',
      location TEXT DEFAULT 'header',
      is_visible INTEGER DEFAULT 1,
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS portfolio_categories (
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
    )`,
    `CREATE TABLE IF NOT EXISTS portfolio_projects (
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
    )`,
    `CREATE TABLE IF NOT EXISTS portfolio_images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL REFERENCES portfolio_projects(id) ON DELETE CASCADE,
      image_url TEXT NOT NULL,
      caption TEXT DEFAULT '',
      alt_text TEXT DEFAULT '',
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS services (
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
    )`,
    `CREATE TABLE IF NOT EXISTS service_packages (
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
    )`,
    `CREATE TABLE IF NOT EXISTS inquiries (
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
    )`,
    `CREATE TABLE IF NOT EXISTS inquiry_notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      inquiry_id INTEGER NOT NULL REFERENCES inquiries(id) ON DELETE CASCADE,
      author_name TEXT NOT NULL,
      note TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS faq_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      question TEXT NOT NULL,
      answer TEXT NOT NULL,
      category TEXT DEFAULT 'general',
      is_published INTEGER DEFAULT 1,
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS terms_content (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      clause_number INTEGER DEFAULT 1,
      clause_text TEXT NOT NULL,
      is_published INTEGER DEFAULT 1,
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS benefits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      icon_name TEXT DEFAULT 'Sparkles',
      image_url TEXT DEFAULT '',
      is_visible INTEGER DEFAULT 1,
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS service_areas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      image_url TEXT DEFAULT '',
      is_primary INTEGER DEFAULT 1,
      is_visible INTEGER DEFAULT 1,
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`
  ];

  console.log('[1/3] Creating tables in Turso Cloud...');
  for (const ddl of tableDefinitions) {
    await turso.execute(ddl);
  }
  console.log('All tables created in Turso.');

  const tables = [
    'admin_users',
    'site_settings',
    'website_sections',
    'website_pages',
    'navigation_items',
    'portfolio_categories',
    'portfolio_projects',
    'portfolio_images',
    'services',
    'service_packages',
    'benefits',
    'terms_content',
    'faq_items',
    'service_areas',
    'inquiries',
    'inquiry_notes',
    'media_assets'
  ];

  console.log('[2/3] Migrating data rows from local SQLite to Turso...');
  for (const table of tables) {
    const rows = localDb.prepare(`SELECT * FROM ${table}`).all();
    if (rows.length === 0) continue;

    console.log(`  -> Copying ${rows.length} rows for table: ${table}`);
    for (const row of rows) {
      const keys = Object.keys(row);
      const values = Object.values(row);
      const placeholders = keys.map(() => '?').join(', ');
      const sql = `INSERT OR REPLACE INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`;

      await turso.execute({
        sql,
        args: values
      });
    }
  }

  console.log('[3/3] Verifying migrated row counts on Turso...');
  for (const table of tables) {
    const res = await turso.execute(`SELECT COUNT(*) as cnt FROM ${table}`);
    const count = res.rows[0].cnt;
    console.log(`  Table [${table}]: ${count} rows`);
  }

  console.log('=== MIGRATION TO TURSO CLOUD COMPLETED SUCCESSFULLY! ===');
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
