import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import { ingestDxf, getProduct, listProducts, syncProductSnapshot } from '../products/product-service.js';
import { createInventoryItem, moveInventory, listInventory, inventoryAlerts } from '../inventory/inventory-service.js';
import { businessSnapshot } from '../services/snapshot.js';
import { upsertFact } from '../services/memory.js';
import { chatWithMerlin } from '../ai/chat.js';
import { runMarketResearch } from '../market/research.js';
import { id } from '../util/id.js';
import { recordSale, productPerformance } from '../services/sales.js';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });

function asyncRoute(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

function requireAutomationToken(req, res, next) {
  const configured = process.env.MERLIN_AUTOMATION_TOKEN;
  if (!configured) return res.status(503).json({ error: 'MERLIN_AUTOMATION_TOKEN not configured' });
  const supplied = req.headers.authorization?.replace(/^Bearer\s+/i, '') || req.headers['x-merlin-token'];
  if (supplied !== configured) return res.status(401).json({ error: 'Unauthorized' });
  next();
}

function jsonField(row, key, fallback) {
  try { return JSON.parse(row[key] || JSON.stringify(fallback)); } catch { return fallback; }
}

function enrichObservationSources(db, o) {
  const ids = jsonField(o, 'source_ids_json', []);
  const sources = ids.map(sid => db.prepare('SELECT id,url,title,publisher,observed_at FROM research_sources WHERE id=?').get(sid)).filter(Boolean);
  return {
    ...o,
    direct_evidence: jsonField(o,'direct_evidence_json',[]),
    supporting_evidence: jsonField(o,'supporting_evidence_json',[]),
    unknowns: jsonField(o,'unknowns_json',[]),
    source_ids: ids,
    sources
  };
}

export function registerRoutes(app, db) {
  app.get('/api/health', (req, res) => res.json({ ok: true, system: 'MERLIN', domain: 'cnc-business-os', now: new Date().toISOString() }));

  app.get('/api/state', (req, res) => res.json(businessSnapshot(db)));

  app.get('/api/dashboard', (req, res) => {
    const products = db.prepare('SELECT COUNT(*) n FROM products').get().n;
    const validated = db.prepare("SELECT COUNT(*) n FROM product_revisions WHERE validation_status='validated'").get().n;
    const stockKinds = db.prepare('SELECT kind, COUNT(*) item_count, SUM(quantity_on_hand) quantity FROM inventory_items WHERE active=1 GROUP BY kind').all();
    const lowStock = inventoryAlerts(db);
    const observations = db.prepare('SELECT * FROM market_observations ORDER BY created_at DESC LIMIT 12').all().map(o => enrichObservationSources(db, o));
    const upgrades = db.prepare("SELECT * FROM system_upgrade_requests WHERE status='proposed' ORDER BY created_at DESC").all().map(u => ({...u, requested_changes: jsonField(u,'requested_changes_json',[])}));
    res.json({ products, validated, stockKinds, lowStock, observations, upgrades });
  });

  app.get('/api/products', (req, res) => res.json(listProducts(db)));
  app.get('/api/products/:id', (req, res) => {
    const product = getProduct(db, req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  });

  app.get('/api/products/:id/performance', (req, res) => {
    const product = db.prepare('SELECT id FROM products WHERE id=?').get(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(productPerformance(db, req.params.id));
  });

  app.get('/api/products/:id/bom', (req, res) => {
    res.json(db.prepare(`SELECT b.*,i.name inventory_name,i.unit inventory_unit,i.unit_cost inventory_unit_cost
      FROM product_bom b JOIN inventory_items i ON i.id=b.inventory_item_id WHERE b.product_id=? ORDER BY i.name`).all(req.params.id));
  });

  app.post('/api/products/:id/bom', (req, res) => {
    const bomId = id('BOM');
    db.prepare(`INSERT INTO product_bom (id,product_id,inventory_item_id,quantity_per_unit,notes)
      VALUES (?,?,?,?,?) ON CONFLICT(product_id,inventory_item_id) DO UPDATE SET quantity_per_unit=excluded.quantity_per_unit,notes=excluded.notes`)
      .run(bomId,req.params.id,req.body.inventory_item_id,Number(req.body.quantity_per_unit),req.body.notes||null);
    syncProductSnapshot(db, req.params.id);
    res.status(201).json(db.prepare('SELECT * FROM product_bom WHERE product_id=? AND inventory_item_id=?').get(req.params.id,req.body.inventory_item_id));
  });

  app.post('/api/products/upload-dxf', upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'DXF file required' });
    if (path.extname(req.file.originalname).toLowerCase() !== '.dxf') return res.status(400).json({ error: 'Only .dxf files are accepted by this endpoint' });
    const product = ingestDxf(db, {
      buffer: req.file.buffer,
      originalname: req.file.originalname,
      name: req.body.name,
      category: req.body.category,
      subcategory: req.body.subcategory,
      language: req.body.language,
      legalStatus: req.body.legal_status
    });
    res.status(201).json(product);
  });

  app.get('/api/products/:id/preview', (req, res) => {
    const product = db.prepare('SELECT active_revision_id FROM products WHERE id=?').get(req.params.id);
    if (!product) return res.status(404).end();
    const revision = db.prepare('SELECT preview_path FROM product_revisions WHERE id=?').get(product.active_revision_id);
    if (!revision?.preview_path || !fs.existsSync(revision.preview_path)) return res.status(404).end();
    res.type('image/svg+xml').sendFile(path.resolve(revision.preview_path));
  });

  app.post('/api/products/:id/status', (req, res) => {
    const allowed = ['imported','geometry_review','prototype_required','test_cut','production_validated','finished_prototype','photographed','listed','active','paused','retired'];
    if (!allowed.includes(req.body.status)) return res.status(400).json({ error: 'Invalid status' });
    const result = db.prepare('UPDATE products SET status=?, updated_at=CURRENT_TIMESTAMP WHERE id=?').run(req.body.status, req.params.id);
    if (!result.changes) return res.status(404).json({ error: 'Product not found' });
    syncProductSnapshot(db, req.params.id);
    res.json(getProduct(db, req.params.id));
  });

  app.post('/api/revisions/:id/validate', (req, res) => {
    if (req.body.validation_status !== 'validated') return res.status(400).json({ error: 'Only explicit manual validation to validated is supported here' });
    const rev = db.prepare('SELECT * FROM product_revisions WHERE id=?').get(req.params.id);
    if (!rev) return res.status(404).json({ error: 'Revision not found' });
    const validation = jsonField(rev, 'validation_json', {});
    validation.manual_validation = { by: 'owner', at: new Date().toISOString(), notes: req.body.notes || null };
    db.prepare("UPDATE product_revisions SET validation_status='validated', validation_json=? WHERE id=?").run(JSON.stringify(validation), rev.id);
    syncProductSnapshot(db, rev.product_id);
    res.json(db.prepare('SELECT * FROM product_revisions WHERE id=?').get(rev.id));
  });

  app.get('/api/inventory', (req, res) => res.json(listInventory(db)));
  app.get('/api/inventory/alerts', (req, res) => res.json(inventoryAlerts(db)));
  app.post('/api/inventory', (req, res) => res.status(201).json(createInventoryItem(db, req.body)));
  app.post('/api/inventory/movements', (req, res) => res.status(201).json(moveInventory(db, req.body)));

  app.get('/api/memory', (req, res) => res.json(db.prepare('SELECT * FROM memory_facts WHERE active=1 ORDER BY category,fact_key').all()));
  app.post('/api/memory', (req, res) => res.status(201).json(upsertFact(db, { ...req.body, source: 'user', confidence: 'direct' })));

  app.get('/api/capabilities', (req, res) => res.json(db.prepare('SELECT * FROM capabilities ORDER BY status,name').all()));
  app.get('/api/upgrades', (req, res) => res.json(db.prepare('SELECT * FROM system_upgrade_requests ORDER BY created_at DESC').all()));

  app.post('/api/sales', (req, res) => { const sale=recordSale(db,req.body); if(req.body.product_id) syncProductSnapshot(db,req.body.product_id); res.status(201).json(sale); });

  app.post('/api/production-runs', (req, res) => {
    const runId = id('RUN');
    db.prepare(`INSERT INTO production_runs (
      id,product_id,revision_id,machine_id,quantity,material_inventory_item_id,cut_seconds,cleanup_seconds,finishing_seconds,packaging_seconds,success,failure_reason,notes
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
      runId,req.body.product_id,req.body.revision_id||null,req.body.machine_id||null,Number(req.body.quantity||1),req.body.material_inventory_item_id||null,
      req.body.cut_seconds??null,req.body.cleanup_seconds??null,req.body.finishing_seconds??null,req.body.packaging_seconds??null,req.body.success===false?0:1,req.body.failure_reason||null,req.body.notes||null
    );
    syncProductSnapshot(db, req.body.product_id);
    res.status(201).json(db.prepare('SELECT * FROM production_runs WHERE id=?').get(runId));
  });

  app.get('/api/market/observations', (req, res) => {
    const rows = db.prepare('SELECT * FROM market_observations ORDER BY created_at DESC LIMIT 100').all();
    res.json(rows.map(o => enrichObservationSources(db, o)));
  });
  app.get('/api/market/sources', (req, res) => res.json(db.prepare('SELECT * FROM research_sources ORDER BY observed_at DESC LIMIT 300').all()));
  app.post('/api/market/research', requireAutomationToken, asyncRoute(async (req, res) => {
    const result = await runMarketResearch(db, req.body.focus || 'current best opportunities for this CNC plasma business');
    res.json(result);
  }));

  app.post('/api/ai/chat', asyncRoute(async (req, res) => {
    if (!req.body.message?.trim()) return res.status(400).json({ error: 'message required' });
    res.json(await chatWithMerlin(db, req.body.message.trim()));
  }));

  app.post('/api/design/from-image', upload.single('file'), (req, res) => {
    res.status(501).json({
      error: 'Not enabled in MERLIN V1',
      reason: 'Arbitrary image-to-production-DXF generation is not reliable enough to call cut-ready. MERLIN will not fake this capability. The architecture reserves this endpoint for a future validated computer-vision + topology + CNC-geometry pipeline.'
    });
  });
}
