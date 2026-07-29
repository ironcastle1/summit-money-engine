const http = require('http');
const fs = require('fs');
const path = require('path');
const { handleApi } = require('./src/router');

const PORT = process.env.PORT || 3000;
const ROOT = path.resolve(__dirname, '..');
const WEB = path.join(ROOT, 'web');

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

function sendFile(res, file) {
  fs.readFile(file, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not found');
      return;
    }
    res.writeHead(200, {
      'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream',
      'Cache-Control': file.endsWith('.html') ? 'no-store' : 'public, max-age=120'
    });
    res.end(data);
  });
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.url.startsWith('/api/')) return handleApi(req, res);
    const parsed = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    let rel = decodeURIComponent(parsed.pathname);
    if (rel === '/') rel = '/index.html';
    const file = path.normalize(path.join(WEB, rel));
    if (!file.startsWith(WEB)) {
      res.writeHead(403); res.end('Forbidden'); return;
    }
    if (fs.existsSync(file) && fs.statSync(file).isFile()) return sendFile(res, file);
    return sendFile(res, path.join(WEB, 'index.html'));
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end(err.stack || err.message);
  }
});

server.listen(PORT, () => {
  console.log(`Summit Info Compiler V10 running on :${PORT}`);
});
