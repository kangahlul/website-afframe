const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', brand: 'AF Frame', platform: 'Vercel Serverless', time: new Date().toISOString() });
});

try {
  app.use('/api/auth', require('../server/routes/auth'));
  app.use('/api/media', require('../server/routes/media'));
  app.use('/api/settings', require('../server/routes/settings'));
  app.use('/api/sections', require('../server/routes/sections'));
  app.use('/api/portfolio', require('../server/routes/portfolio'));
  app.use('/api/services', require('../server/routes/services'));
  app.use('/api/inquiries', require('../server/routes/inquiries'));
  app.use('/api/content', require('../server/routes/content'));
  app.use('/api/dashboard', require('../server/routes/dashboard'));
} catch (err) {
  console.error('[Route Load Error]', err);
}

// Global error handler
app.use((err, req, res, next) => {
  console.error('[Vercel Serverless Error]', err);
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

module.exports = app;
