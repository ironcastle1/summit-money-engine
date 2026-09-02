import fs from 'node:fs';
import path from 'node:path';
import { id, sha256 } from '../util/id.js';
import { safeFilename } from '../services/filesystem.js';
import { analyseDxfText } from '../dxf/analyse.js';
import { renderSvg } from '../dxf/render-svg.js';

function serialiseRevision(r) {
  let validation = {};
  try { validation = JSON.parse(r.validation_json || '{}'); } catch {}
  return { ...r, validation };
}

function cleanWords(name) {
  return String(name || '')
    .replace(/\.[^.]+$/, '')
    .replace(/[_-]+/g, ' ')
    .replace(/[^A-Za-z0-9 ]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

export function shortPrefix(name) {
  const words = cleanWords(name);
  if (!words.length) return 'PRD';
  if (words.length === 1) {
    const letters = words[0].replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    return (letters.slice(0, 3) || 'PRD').padEnd(3, 'X');
  }
  if (words.length === 2) {
    const a = words[0].toUpperCase().replace(/[^A-Z0-9]/g,'');
    const b = words[1].toUpperCase().replace(/[^A-Z0-9]/g,'');
    return `${a.slice(0,2)}${b.slice(0,1)}`.padEnd(3,'X');
  }
  return words.slice(0, 3).map(w => w[0]).join('').toUpperCase().slice(0,3).padEnd(3,'X');
}

function sequenceFromCode(code) {
  const m = String(code || '').match(/(\d{1,6})$/);
  return m ? Number(m[1]) : null;
}

function nextSequence(db) {
  const meta = Number(db.prepare("SELECT value FROM meta WHERE key='product_sequence'").get()?.value || 0);
  const existing = db.prepare('SELECT product_code FROM products').all().map(r => sequenceFromCode(r.product_code)).filter(Number.isFinite);
  const currentMax = existing.length ? Math.max(...existing, meta) : meta;
  const next = currentMax + 1;
  db.prepare("INSERT INTO meta (key,value) VALUES ('product_sequence',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").run(String(next));
  return next;
}

function codeFor(name, number) {
  return `${shortPrefix(name)}-${String(number).padStart(3, '0')}`;
}

function nextProductCode(db, name) {
  let n = nextSequence(db);
  let code = codeFor(name, n);
  while (db.prepare('SELECT 1 FROM products WHERE product_code=?').get(code)) {
    n = nextSequence(db);
    code = codeFor(name, n);
  }
  return code;
}

function productRoot(productCode) {
  return path.resolve(process.env.MERLIN_PRODUCT_DIR || './data/products', productCode);
}

function makeProductFolders(productCode) {
  const root = productRoot(productCode);
  for (const dir of ['master','revisions','previews','photos','listings','production','costing','documents','assets']) {
    fs.mkdirSync(path.join(root, dir), { recursive: true });
  }
  return root;
}

function replacePathPrefix(value, oldRoot, newRoot) {
  if (!value) return value;
  const abs = path.resolve(value);
  if (!abs.startsWith(oldRoot)) return value;
  return path.join(newRoot, path.relative(oldRoot, abs));
}

function mergeDirectory(source, destination) {
  fs.mkdirSync(destination, { recursive: true });
  for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
    const from = path.join(source, entry.name);
    const to = path.join(destination, entry.name);
    if (entry.isDirectory()) mergeDirectory(from, to);
    else if (!fs.existsSync(to)) fs.renameSync(from, to);
  }
  try { fs.rmSync(source, { recursive: true, force: true }); } catch {}
}

function moveProductFolder(db, productId, oldCode, newCode) {
  if (!oldCode || oldCode === newCode) return;
  const oldRoot = productRoot(oldCode);
  const newRoot = productRoot(newCode);
  try {
    if (fs.existsSync(oldRoot) && !fs.existsSync(newRoot)) fs.renameSync(oldRoot, newRoot);
    else if (fs.existsSync(oldRoot) && fs.existsSync(newRoot)) mergeDirectory(oldRoot, newRoot);
    else makeProductFolders(newCode);
  } catch {
    makeProductFolders(newCode);
  }

  for (const rev of db.prepare('SELECT id,stored_path,preview_path FROM product_revisions WHERE product_id=?').all(productId)) {
    const stored = replacePathPrefix(rev.stored_path, oldRoot, newRoot);
    const preview = replacePathPrefix(rev.preview_path, oldRoot, newRoot);
    if (stored !== rev.stored_path || preview !== rev.preview_path) {
      db.prepare('UPDATE product_revisions SET stored_path=?,preview_path=? WHERE id=?').run(stored, preview, rev.id);
    }
  }
  for (const asset of db.prepare('SELECT id,stored_path FROM product_assets WHERE product_id=?').all(productId)) {
    const stored = replacePathPrefix(asset.stored_path, oldRoot, newRoot);
    if (stored !== asset.stored_path) db.prepare('UPDATE product_assets SET stored_path=? WHERE id=?').run(stored, asset.id);
  }
}

export function migrateLegacyProductCodes(db) {
  const rows = db.prepare('SELECT id,product_code,name,created_at FROM products ORDER BY created_at,id').all();
  let maxSeq = Number(db.prepare("SELECT value FROM meta WHERE key='product_sequence'").get()?.value || 0);
  const used = new Set(rows.map(r => r.product_code));
  for (const p of rows) {
    const existingSeq = sequenceFromCode(p.product_code);
    if (existingSeq) maxSeq = Math.max(maxSeq, existingSeq);
    if (/^[A-Z0-9]{2,4}-\d{3}$/.test(p.product_code)) continue;
    let n = existingSeq || (++maxSeq);
    let candidate = codeFor(p.name, n);
    while (used.has(candidate) && candidate !== p.product_code) candidate = codeFor(p.name, ++maxSeq);
    const old = p.product_code;
    used.delete(old); used.add(candidate);
    moveProductFolder(db, p.id, old, candidate);
    db.prepare('UPDATE products SET product_code=?,updated_at=CURRENT_TIMESTAMP WHERE id=?').run(candidate, p.id);
    db.prepare("UPDATE inventory_items SET sku=? WHERE kind='finished_product' AND linked_product_id=?").run(candidate, p.id);
    syncProductSnapshot(db, p.id);
  }
  db.prepare("INSERT INTO meta (key,value) VALUES ('product_sequence',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").run(String(maxSeq));
}

export function syncProductSnapshot(db, productId) {
  const p = db.prepare('SELECT product_code FROM products WHERE id=?').get(productId);
  if (!p) return;
  const root = makeProductFolders(p.product_code);
  const product = getProduct(db, productId);
  fs.writeFileSync(path.join(root, 'product.json'), JSON.stringify(product, null, 2));
}

function writeRevision(db, product, buffer, originalname, revisionNumber, unitOverride, isMaster = false) {
  const machine = db.prepare('SELECT * FROM machines WHERE active = 1 ORDER BY created_at LIMIT 1').get();
  const text = buffer.toString('utf8');
  const analysis = analyseDxfText(text, machine, { unitOverride });
  const revisionId = id('REV');
  const root = makeProductFolders(product.product_code);
  const storedName = `R${revisionNumber}_${safeFilename(originalname)}`;
  const storedPath = path.join(root, isMaster ? 'master' : 'revisions', storedName);
  fs.writeFileSync(storedPath, buffer);
  const previewPath = path.join(root, 'previews', `${product.product_code}_R${revisionNumber}.svg`);
  fs.writeFileSync(previewPath, renderSvg(analysis));
  const unitsConfirmed = Boolean(analysis.units.mm_per_unit);

  db.prepare(`INSERT INTO product_revisions (
    id,product_id,revision_number,original_filename,stored_path,sha256,width_mm,height_mm,
    drawing_width_units,drawing_height_units,unit_code,unit_name,mm_per_unit,units_confirmed,
    entity_count,total_cut_length_mm,pierce_estimate,closed_path_count,open_path_count,small_feature_count,
    duplicate_entity_count,unsupported_entity_count,fits_machine,validation_status,validation_json,preview_path
  ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
    revisionId, product.id, revisionNumber, originalname, storedPath, sha256(buffer), analysis.width_mm, analysis.height_mm,
    analysis.drawing_width_units, analysis.drawing_height_units, analysis.units.code, analysis.units.name,
    analysis.units.mm_per_unit, Number(unitsConfirmed), analysis.entity_count, analysis.total_cut_length_mm,
    analysis.pierce_estimate, analysis.closed_path_count, analysis.open_path_count, analysis.small_feature_count,
    analysis.duplicate_entity_count, analysis.unsupported_entity_count,
    analysis.fits_machine == null ? null : Number(analysis.fits_machine), analysis.validation_status,
    JSON.stringify({ issues: analysis.issues, bounds: analysis.bounds, drawing_bounds: analysis.drawing_bounds, units: analysis.units }), previewPath
  );
  return revisionId;
}

export function ingestDxf(db, { buffer, originalname, name, category, subcategory, language, legalStatus, unitOverride = null, primaryMaterialId = null }) {
  const productName = name?.trim() || path.basename(originalname, path.extname(originalname));
  const productId = id('PROD');
  const productCode = nextProductCode(db, productName);
  const product = { id: productId, product_code: productCode };
  const tx = db.transaction(() => {
    db.prepare(`INSERT INTO products (
      id,product_code,name,category,subcategory,language,legal_status,primary_material_inventory_item_id
    ) VALUES (?,?,?,?,?,?,?,?)`).run(
      productId, productCode, productName, category || null, subcategory || null, language || null,
      legalStatus || 'review_required', primaryMaterialId || null
    );
    const revisionId = writeRevision(db, product, buffer, originalname, 1, unitOverride, true);
    db.prepare('UPDATE products SET active_revision_id=? WHERE id=?').run(revisionId, productId);
  });
  tx();
  syncProductSnapshot(db, productId);
  return getProduct(db, productId);
}

export function addDxfRevision(db, productId, { buffer, originalname, unitOverride = null }) {
  const product = db.prepare('SELECT * FROM products WHERE id=?').get(productId);
  if (!product) throw Object.assign(new Error('Product not found'), { status: 404 });
  const next = Number(db.prepare('SELECT COALESCE(MAX(revision_number),0)+1 n FROM product_revisions WHERE product_id=?').get(productId).n || 1);
  const tx = db.transaction(() => {
    const revisionId = writeRevision(db, product, buffer, originalname, next, unitOverride, false);
    db.prepare('UPDATE products SET active_revision_id=?,status=?,updated_at=CURRENT_TIMESTAMP WHERE id=?').run(revisionId,'imported',productId);
  });
  tx();
  syncProductSnapshot(db, productId);
  return getProduct(db, productId);
}

function unitOverrideForRevision(rev) {
  if (!rev.units_confirmed || !rev.unit_name) return null;
  const name = String(rev.unit_name).toLowerCase();
  if (name.includes('millimeter')) return 'millimeters';
  if (name.includes('inch')) return 'inches';
  if (name.includes('centimeter')) return 'centimeters';
  if (name === 'meters' || name.includes('meter')) return 'meters';
  return null;
}

export function reanalyseRevision(db, revisionId) {
  const rev = db.prepare('SELECT * FROM product_revisions WHERE id=?').get(revisionId);
  if (!rev) throw Object.assign(new Error('Revision not found'), { status: 404 });
  if (!rev.stored_path || !fs.existsSync(rev.stored_path)) throw Object.assign(new Error('Stored DXF file is unavailable'), { status: 409 });
  const product = db.prepare('SELECT * FROM products WHERE id=?').get(rev.product_id);
  const machine = db.prepare('SELECT * FROM machines WHERE active=1 ORDER BY created_at LIMIT 1').get();
  const text = fs.readFileSync(rev.stored_path, 'utf8');
  const analysis = analyseDxfText(text, machine, { unitOverride: unitOverrideForRevision(rev) });
  const previewPath = path.join(makeProductFolders(product.product_code), 'previews', `${product.product_code}_R${rev.revision_number}.svg`);
  fs.writeFileSync(previewPath, renderSvg(analysis));
  db.prepare(`UPDATE product_revisions SET
    width_mm=?,height_mm=?,drawing_width_units=?,drawing_height_units=?,unit_code=?,unit_name=?,mm_per_unit=?,units_confirmed=?,
    entity_count=?,total_cut_length_mm=?,pierce_estimate=?,closed_path_count=?,open_path_count=?,small_feature_count=?,duplicate_entity_count=?,
    unsupported_entity_count=?,fits_machine=?,validation_status=?,validation_json=?,preview_path=? WHERE id=?`).run(
    analysis.width_mm, analysis.height_mm, analysis.drawing_width_units, analysis.drawing_height_units,
    analysis.units.code, analysis.units.name, analysis.units.mm_per_unit, Number(Boolean(analysis.units.mm_per_unit)), analysis.entity_count,
    analysis.total_cut_length_mm, analysis.pierce_estimate, analysis.closed_path_count, analysis.open_path_count,
    analysis.small_feature_count, analysis.duplicate_entity_count, analysis.unsupported_entity_count,
    analysis.fits_machine == null ? null : Number(analysis.fits_machine), analysis.validation_status,
    JSON.stringify({ issues: analysis.issues, bounds: analysis.bounds, drawing_bounds: analysis.drawing_bounds, units: analysis.units }), previewPath, rev.id
  );
  syncProductSnapshot(db, rev.product_id);
  return serialiseRevision(db.prepare('SELECT * FROM product_revisions WHERE id=?').get(rev.id));
}

export function reanalyseProducts(db, productIds = null) {
  const ids = Array.isArray(productIds) && productIds.length
    ? productIds
    : db.prepare('SELECT id FROM products ORDER BY created_at').all().map(r => r.id);
  const results = [];
  for (const productId of ids) {
    const p = db.prepare('SELECT id,product_code,name,active_revision_id FROM products WHERE id=?').get(productId);
    if (!p) { results.push({ product_id: productId, status: 'missing' }); continue; }
    if (!p.active_revision_id) { results.push({ product_id: p.id, product_code:p.product_code, name:p.name, status:'no_revision' }); continue; }
    try {
      const r = reanalyseRevision(db, p.active_revision_id);
      results.push({ product_id:p.id, product_code:p.product_code, name:p.name, status:'analysed', revision_id:r.id, open_path_count:r.open_path_count, unsupported_entity_count:r.unsupported_entity_count, duplicate_entity_count:r.duplicate_entity_count, units_confirmed:r.units_confirmed, fits_machine:r.fits_machine });
    } catch (error) {
      results.push({ product_id:p.id, product_code:p.product_code, name:p.name, status:'error', error:error.message });
    }
  }
  return { analysed: results.filter(r=>r.status==='analysed').length, errors:results.filter(r=>r.status==='error').length, results };
}

export function reconfirmRevisionUnits(db, revisionId, unitOverride) {
  const rev = db.prepare('SELECT * FROM product_revisions WHERE id=?').get(revisionId);
  if (!rev) return null;
  if (!rev.stored_path || !fs.existsSync(rev.stored_path)) throw Object.assign(new Error('Stored DXF file is unavailable.'), { status: 409 });
  const machine = db.prepare('SELECT * FROM machines WHERE active=1 ORDER BY created_at LIMIT 1').get();
  const text = fs.readFileSync(rev.stored_path, 'utf8');
  const analysis = analyseDxfText(text, machine, { unitOverride });
  db.prepare(`UPDATE product_revisions SET
    width_mm=?,height_mm=?,drawing_width_units=?,drawing_height_units=?,unit_code=?,unit_name=?,mm_per_unit=?,units_confirmed=?,
    entity_count=?,total_cut_length_mm=?,pierce_estimate=?,closed_path_count=?,open_path_count=?,small_feature_count=?,duplicate_entity_count=?,
    unsupported_entity_count=?,fits_machine=?,validation_status=?,validation_json=? WHERE id=?`).run(
      analysis.width_mm, analysis.height_mm, analysis.drawing_width_units, analysis.drawing_height_units,
      analysis.units.code, analysis.units.name, analysis.units.mm_per_unit, Number(Boolean(analysis.units.mm_per_unit)), analysis.entity_count,
      analysis.total_cut_length_mm, analysis.pierce_estimate, analysis.closed_path_count, analysis.open_path_count,
      analysis.small_feature_count, analysis.duplicate_entity_count, analysis.unsupported_entity_count,
      analysis.fits_machine == null ? null : Number(analysis.fits_machine), analysis.validation_status,
      JSON.stringify({ issues: analysis.issues, bounds: analysis.bounds, drawing_bounds: analysis.drawing_bounds, units: analysis.units }), revisionId
    );
  syncProductSnapshot(db, rev.product_id);
  return serialiseRevision(db.prepare('SELECT * FROM product_revisions WHERE id=?').get(revisionId));
}

function validateProductCode(db, code, productId) {
  const clean = String(code || '').trim().toUpperCase();
  if (!/^[A-Z0-9]{2,5}-\d{3}$/.test(clean)) throw Object.assign(new Error('Product code must look like JOK-001 or NUM-014'), { status:400 });
  const exists = db.prepare('SELECT id FROM products WHERE product_code=? AND id<>?').get(clean, productId);
  if (exists) throw Object.assign(new Error('That product code is already in use'), { status:409 });
  return clean;
}

export function updateProduct(db, productId, input) {
  const current = db.prepare('SELECT * FROM products WHERE id=?').get(productId);
  if (!current) return null;
  let nextCode = current.product_code;
  if (input.product_code !== undefined && input.product_code !== current.product_code) nextCode = validateProductCode(db, input.product_code, productId);
  if (nextCode !== current.product_code) moveProductFolder(db, productId, current.product_code, nextCode);
  db.prepare(`UPDATE products SET product_code=?,name=?,category=?,subcategory=?,language=?,status=?,legal_status=?,notes=?,
    primary_material_inventory_item_id=?,target_width_mm=?,target_height_mm=?,selling_price=?,updated_at=CURRENT_TIMESTAMP WHERE id=?`).run(
      nextCode,
      input.name ?? current.name,
      input.category ?? current.category,
      input.subcategory ?? current.subcategory,
      input.language ?? current.language,
      input.status ?? current.status,
      input.legal_status ?? current.legal_status,
      input.notes ?? current.notes,
      input.primary_material_inventory_item_id ?? current.primary_material_inventory_item_id,
      input.target_width_mm === undefined ? current.target_width_mm : (input.target_width_mm == null ? null : Number(input.target_width_mm)),
      input.target_height_mm === undefined ? current.target_height_mm : (input.target_height_mm == null ? null : Number(input.target_height_mm)),
      input.selling_price === undefined ? current.selling_price : (input.selling_price == null ? null : Number(input.selling_price)),
      productId
    );
  if (nextCode !== current.product_code) db.prepare("UPDATE inventory_items SET sku=? WHERE kind='finished_product' AND linked_product_id=?").run(nextCode, productId);
  syncProductSnapshot(db, productId);
  return getProduct(db, productId);
}

export function getProduct(db, productId) {
  const product = db.prepare(`SELECT p.*,i.name primary_material_name,i.thickness_mm primary_material_thickness_mm,
    i.width_mm primary_material_width_mm,i.height_mm primary_material_height_mm
    FROM products p LEFT JOIN inventory_items i ON i.id=p.primary_material_inventory_item_id WHERE p.id=?`).get(productId);
  if (!product) return null;
  const revisions = db.prepare('SELECT * FROM product_revisions WHERE product_id=? ORDER BY revision_number DESC').all(productId).map(serialiseRevision);
  const costs = db.prepare('SELECT * FROM product_costs WHERE product_id=? ORDER BY effective_from DESC').all(productId);
  const production = db.prepare('SELECT * FROM production_runs WHERE product_id=? ORDER BY created_at DESC LIMIT 100').all(productId);
  const sales = db.prepare('SELECT * FROM sales_events WHERE product_id=? ORDER BY sold_at DESC LIMIT 100').all(productId);
  const performance = db.prepare(`SELECT
    COALESCE(SUM(quantity),0) units_sold,
    COALESCE(SUM(gross_revenue),0) gross_revenue,
    COALESCE(SUM(fees),0) fees,
    COALESCE(SUM(shipping_cost),0) shipping_cost,
    COALESCE(SUM(refunds),0) refunds
    FROM sales_events WHERE product_id=?`).get(productId);
  const productionSummary = db.prepare(`SELECT COUNT(*) run_count,AVG(cut_seconds) avg_cut_seconds,AVG(cleanup_seconds) avg_cleanup_seconds,
    AVG(finishing_seconds) avg_finishing_seconds,AVG(packaging_seconds) avg_packaging_seconds FROM production_runs WHERE product_id=? AND success=1`).get(productId);
  const bom = db.prepare(`SELECT b.*,i.name inventory_name,i.unit inventory_unit,i.unit_cost inventory_unit_cost
    FROM product_bom b JOIN inventory_items i ON i.id=b.inventory_item_id WHERE b.product_id=? ORDER BY i.name`).all(productId);
  const assets = db.prepare('SELECT * FROM product_assets WHERE product_id=? ORDER BY created_at DESC').all(productId);
  return { ...product, revisions, costs, production, sales, performance, production_summary:productionSummary, bom, assets };
}

export function listProducts(db) {
  return db.prepare(`
    SELECT p.*,r.revision_number,r.width_mm,r.height_mm,r.drawing_width_units,r.drawing_height_units,r.unit_name,r.units_confirmed,
      r.validation_status,r.fits_machine,r.preview_path,r.id revision_id,r.open_path_count,r.unsupported_entity_count,r.duplicate_entity_count,
      r.entity_count,r.pierce_estimate,i.name primary_material_name,i.thickness_mm primary_material_thickness_mm,
      COALESCE((SELECT SUM(s.quantity) FROM sales_events s WHERE s.product_id=p.id),0) units_sold,
      COALESCE((SELECT SUM(s.gross_revenue) FROM sales_events s WHERE s.product_id=p.id),0) gross_revenue,
      (SELECT AVG(pr.cut_seconds) FROM production_runs pr WHERE pr.product_id=p.id AND pr.success=1 AND pr.cut_seconds IS NOT NULL) avg_cut_seconds,
      (SELECT AVG(pr.cleanup_seconds) FROM production_runs pr WHERE pr.product_id=p.id AND pr.success=1 AND pr.cleanup_seconds IS NOT NULL) avg_cleanup_seconds
    FROM products p
    LEFT JOIN product_revisions r ON r.id=p.active_revision_id
    LEFT JOIN inventory_items i ON i.id=p.primary_material_inventory_item_id
    ORDER BY p.created_at ASC,p.product_code ASC
  `).all();
}
