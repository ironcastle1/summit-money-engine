import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ensureDirectories } from './src/services/filesystem.js';
import { openDatabase, migrateDatabase } from './src/db/database.js';
import { registerRoutes } from './src/routes/index.js';
import { migrateLegacyProductCodes } from './src/products/product-service.js';
import { seedCurrentBusiness } from './src/db/seed.js';
import { startMarketResearchScheduler } from './src/market/scheduler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

ensureDirectories();
const db = openDatabase();
migrateDatabase(db);
seedCurrentBusiness(db);
migrateLegacyProductCodes(db);

const app = express();
const allowedOrigins = (process.env.MERLIN_ALLOWED_ORIGINS || '').split(',').map(v => v.trim()).filter(Boolean);
app.use(cors({ origin(origin, cb) { if (!origin || !allowedOrigins.length || allowedOrigins.includes(origin)) return cb(null, true); cb(new Error(`Origin not allowed: ${origin}`)); } }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

registerRoutes(app, db);
const publicDir = path.resolve(process.env.MERLIN_PUBLIC_DIR || path.join(__dirname, 'public'));
app.use(express.static(publicDir));
app.use((req, res, next) => { if (req.method !== 'GET' || req.path.startsWith('/api/')) return next(); res.sendFile(path.join(publicDir, 'index.html')); });
app.use((err, req, res, next) => { console.error(err); if (res.headersSent) return next(err); res.status(err.status || 500).json({ error: err.message || 'Internal server error', code: err.code || 'MERLIN_ERROR' }); });

const port = Number(process.env.PORT || 3000);
app.listen(port, () => {
  console.log(`MERLIN CNC V8.0.2 running on http://localhost:${port}`);
  startMarketResearchScheduler(db);
});
