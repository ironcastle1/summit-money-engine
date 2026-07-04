const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const apiRouter = require('./api');
const { refreshAll } = require('./services/refreshService');
const { VERSION } = require('./services/stateService');

const app = express();
const PORT = process.env.PORT || 3000;

app.disable('x-powered-by');
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(compression());
app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, '..', 'web'), { maxAge: 0, etag: false }));

app.get('/health', (req, res) => {
  res.json({ ok: true, version: VERSION, ts: new Date().toISOString() });
});

app.use('/api', apiRouter);

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'web', 'index.html'));
});

app.listen(PORT, async () => {
  console.log(`[summit] ${VERSION}`);
  console.log(`[summit] listening on ${PORT}`);
  refreshAll().catch(err => console.error('[summit] initial refresh failed', err.message));
  setInterval(() => refreshAll().catch(err => console.error('[summit] refresh failed', err.message)), 45_000);
});
