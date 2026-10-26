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


// Mount routes individually so one failing doesn't stop others
const routeList = [
  ['/api/auth', './../server/routes/auth'],
  ['/api/media', './../server/routes/media'],
  ['/api/settings', './../server/routes/settings'],
  ['/api/sections', './../server/routes/sections'],
  ['/api/portfolio', './../server/routes/portfolio'],
  ['/api/services', './../server/routes/services'],
  ['/api/inquiries', './../server/routes/inquiries'],
  ['/api/content', './../server/routes/content'],
  ['/api/dashboard', './../server/routes/dashboard']
];

for (const [prefix, path] of routeList) {
  try {
    app.use(prefix, require(path));
  } catch (err) {
    console.error(`[Route Error: ${prefix}]`, err);
  }
}

// Global error handler
app.use((err, req, res, next) => {
  console.error('[Vercel Serverless Error]', err);
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

module.exports = app;
