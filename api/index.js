const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Never cache API responses
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

// Health check endpoint (both /api/health and /health)
app.get(['/api/health', '/health'], (req, res) => {
  res.json({ status: 'ok', brand: 'AF Frame', platform: 'Vercel Serverless', time: new Date().toISOString() });
});

// Statically required routes for Vercel bundler / NFT tracing
const authRoute = require('../server/routes/auth');
const mediaRoute = require('../server/routes/media');
const settingsRoute = require('../server/routes/settings');
const sectionsRoute = require('../server/routes/sections');
const portfolioRoute = require('../server/routes/portfolio');
const servicesRoute = require('../server/routes/services');
const inquiriesRoute = require('../server/routes/inquiries');
const contentRoute = require('../server/routes/content');
const dashboardRoute = require('../server/routes/dashboard');

// Mount with and without /api prefix for bulletproof Vercel rewrite compatibility
app.use('/api/auth', authRoute);
app.use('/auth', authRoute);

app.use('/api/media', mediaRoute);
app.use('/media', mediaRoute);

app.use('/api/settings', settingsRoute);
app.use('/settings', settingsRoute);

app.use('/api/sections', sectionsRoute);
app.use('/sections', sectionsRoute);

app.use('/api/portfolio', portfolioRoute);
app.use('/portfolio', portfolioRoute);

app.use('/api/services', servicesRoute);
app.use('/services', servicesRoute);

app.use('/api/inquiries', inquiriesRoute);
app.use('/inquiries', inquiriesRoute);

app.use('/api/content', contentRoute);
app.use('/content', contentRoute);

app.use('/api/dashboard', dashboardRoute);
app.use('/dashboard', dashboardRoute);

// Global error handler
app.use((err, req, res, next) => {
  console.error('[Vercel Serverless Error]', err);
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

module.exports = app;
