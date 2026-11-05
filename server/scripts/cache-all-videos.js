const https = require('https');
const fs = require('fs');
const path = require('path');
const { db } = require('../db');

const cacheDir = path.join(__dirname, '../video_cache');
if (!fs.existsSync(cacheDir)) {
  fs.mkdirSync(cacheDir, { recursive: true });
}

const agent = new https.Agent({
  keepAlive: true,
  maxSockets: 10,
  timeout: 120000,
});

async function run() {
  console.log('[Video Cache Warmer] Scanning published projects...');
  const projects = await db.prepare('SELECT id, title, featured_video_url FROM portfolio_projects WHERE is_published = 1').all();
  const videoMap = new Map();

  projects.forEach(p => {
    if (p.featured_video_url && p.featured_video_url.includes('drive.google.com')) {
      const m = p.featured_video_url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || p.featured_video_url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
      if (m && m[1]) videoMap.set(m[1], p.title);
    }
  });

  const ids = [...videoMap.keys()];
  console.log(`[Video Cache Warmer] Found ${ids.length} videos to verify/cache.`);

  for (let i = 0; i < ids.length; i++) {
    const id = ids[i];
    const title = videoMap.get(id);
    const targetFile = path.join(cacheDir, `${id}.mp4`);
    const partFile = path.join(cacheDir, `${id}.part`);

    if (fs.existsSync(targetFile)) {
      try {
        const sz = fs.statSync(targetFile).size;
        if (sz > 100000) {
          console.log(`[${i + 1}/${ids.length}] ALREADY CACHED: ${title} (${(sz / 1024 / 1024).toFixed(1)}MB)`);
          continue;
        }
      } catch (_) {}
    }

    console.log(`[${i + 1}/${ids.length}] Downloading: ${title} (${id})...`);
    const t0 = Date.now();

    try {
      await downloadVideo(id, partFile, targetFile);
      const sz = fs.statSync(targetFile).size;
      console.log(`[${i + 1}/${ids.length}] SUCCESS: ${title} (${(sz / 1024 / 1024).toFixed(1)}MB in ${((Date.now() - t0) / 1000).toFixed(1)}s)`);
    } catch (err) {
      console.error(`[${i + 1}/${ids.length}] FAILED: ${title} - ${err.message}`);
    }

    // Brief 1s pause between videos to prevent throttling
    await new Promise(r => setTimeout(r, 1000));
  }

  console.log('[Video Cache Warmer] All videos cached on local disk! Video playback is now 100% INSTANT!');
}

function downloadVideo(cleanId, partFile, targetFile) {
  return new Promise((resolve, reject) => {
    const targetUrl = `https://drive.usercontent.google.com/download?id=${cleanId}&export=download&authuser=0&confirm=t`;
    const fileStream = fs.createWriteStream(partFile);

    function fetchUrl(url, redirectCount = 0) {
      if (redirectCount > 5) {
        fileStream.close();
        return reject(new Error('Too many redirects'));
      }

      https.get(url, { agent, headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': '*/*'
      } }, res => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          res.resume();
          return fetchUrl(res.headers.location, redirectCount + 1);
        }

        if (res.statusCode !== 200 && res.statusCode !== 206) {
          fileStream.close();
          try { fs.unlinkSync(partFile); } catch (_) {}
          return reject(new Error(`HTTP ${res.statusCode}`));
        }

        res.pipe(fileStream);
        fileStream.on('finish', () => {
          fileStream.close();
          try {
            if (fs.existsSync(partFile) && fs.statSync(partFile).size > 100000) {
              fs.renameSync(partFile, targetFile);
              resolve();
            } else {
              reject(new Error('File too small'));
            }
          } catch (e) {
            reject(e);
          }
        });
      }).on('error', err => {
        fileStream.close();
        try { fs.unlinkSync(partFile); } catch (_) {}
        reject(err);
      });
    }

    fetchUrl(targetUrl);
  });
}

run().catch(console.error);
