const { createClient } = require('@libsql/client');
const path = require('path');
const fs = require('fs');

// Load environment variables if available
const envPath = path.join(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath });
}

const TURSO_URL = process.env.TURSO_DATABASE_URL || 'libsql://afframe-db-kangahlul.aws-ap-northeast-1.turso.io';
const TURSO_TOKEN = process.env.TURSO_AUTH_TOKEN || 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3OTMwMDQ1NzQsImlkIjoiMDFhMTc3NjUtMTEwMS03NzhkLTljNzQtMmM0OWU0MjJiNTUwIiwia2lkIjoiSkJqcHYtYXJqVHh0SEFXYkxNSGNyOV9qVlFQRVJ1ZFJBbEkxRGlUT2I5ZyIsInJpZCI6IjRmNDc1YTI4LWJhYWItNDc1YS04YzZiLTk2NDIxY2Q5MThhMiJ9.0BpV_sBctFhCDsHqQ8984xLEvRSwuLPpbqJVsK7tdeqReRGKNW4monbmD5PfXEODm6rCAXFGBj3pD2eZ8UzuAg';

const tursoClient = createClient({
  url: TURSO_URL,
  authToken: TURSO_TOKEN
});

// Database interface compatible with both Turso Cloud and serverless runtimes
const db = {
  prepare(sql) {
    return {
      async all(...args) {
        const flatArgs = args.flat();
        const res = await tursoClient.execute({ sql, args: flatArgs });
        return res.rows;
      },
      async get(...args) {
        const flatArgs = args.flat();
        const res = await tursoClient.execute({ sql, args: flatArgs });
        return res.rows[0] || null;
      },
      async run(...args) {
        const flatArgs = args.flat();
        const res = await tursoClient.execute({ sql, args: flatArgs });
        return {
          changes: res.rowsAffected,
          lastInsertRowid: res.lastInsertRowid !== undefined ? Number(res.lastInsertRowid) : 0
        };
      }
    };
  },
  transaction(fn) {
    return async function(...args) {
      return await fn(...args);
    };
  },
  async exec(sql) {
    return await tursoClient.execute(sql);
  }
};

async function initDatabase() {
  console.log('[Turso] Database client initialized and connected to cloud.');
  return true;
}

module.exports = {
  db,
  tursoClient,
  initDatabase
};
