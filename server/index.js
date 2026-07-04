const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const api = require('./api');
const { startScheduler, refreshNow } = require('./services/scheduler');
const { VERSION } = require('./services/state');

const app = express();
const PORT = process.env.PORT || 3000;

app.disable('x-powered-by');
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.use(cors());
app.use(compression());
app.use(express.json({ limit: '2mb' }));
app.use(express.static(path.join(__dirname, '..', 'web'), { etag: false, maxAge: 0 }));

app.get('/health', (req, res) => res.json({ ok: true, version: VERSION, ts: new Date().toISOString() }));
app.use('/api', api);
app.get('*', (req, res) => res.sendFile(path.join(__dirname, '..', 'web', 'index.html')));

app.listen(PORT, async () => {
  console.log(`[summit] ${VERSION}`);
  console.log(`[summit] listening on ${PORT}`);
  await refreshNow().catch(err => console.error('[summit] initial refresh failed', err.message));
  startScheduler();
});
