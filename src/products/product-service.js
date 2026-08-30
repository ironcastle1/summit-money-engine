import fs from 'node:fs';
import path from 'node:path';
import { id, sha256 } from '../util/id.js';
import { safeFilename } from '../services/filesystem.js';
import { analyseDxfText } from '../dxf/analyse.js';
import { renderSvg } from '../dxf/render-svg.js';

function nextProductCode(db, category = 'GEN') {
  const prefix = String(category || 'GEN').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8) || 'GEN';
  const row = db.prepare("SELECT value FROM meta WHERE key='product_sequence'").get();
  const next = Number(row?.value || 0) + 1;
  db.prepare("INSERT INTO meta (key,value) VALUES ('product_sequence',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").run(String(next));
  return `MER-${prefix}-${String(next).padStart(6, '0')}`;
}

function makeProductFolders(productCode) {
  const root = path.resolve(process.env.MERLIN_PRODUCT_DIR || './data/products', productCode);
  for (const dir of ['master','revisions','previews','photos','listings','production','costing']) {
    fs.mkdirSync(path.join(root, dir), { recursive: true });
  }
  return root;
}

export function syncProductSnapshot(db, productId) {
  const p = db.prepare('SELECT product_code FROM products WHERE id=?').get(productId);
  if (!p) return;
  const root = makeProductFolders(p.product_code);
  writeProductSnapshot(db, productId, root);
}

function writeProductSnapshot(db, productId, root) {
  const product = getProduct(db, productId);
  const serialisable = JSON.parse(JSON.stringify(product));
  fs.writeFileSync(path.join(root, 'product.json'), JSON.stringify(serialisable, null, 2));
}

export function ingestDxf(db, { buffer, originalname, name, category, subcategory, language, legalStatus }) {
  const text = buffer.toString('utf8');
  const machine = db.prepare('SELECT * FROM machines WHERE active = 1 ORDER BY created_at LIMIT 1').get();
  const analysis = analyseDxfText(text, machine);

  const productId = id('PROD');
  const productCode = nextProductCode(db, category || 'ART');
  const revisionId = id('REV');
  const productName = name?.trim() || path.basename(originalname, path.extname(originalname));
  const root = makeProductFolders(productCode);
  const storedName = `R1_${safeFilename(originalname)}`;
  const storedPath = path.join(root, 'master', storedName);
  fs.writeFileSync(storedPath, buffer);

  const previewPath = path.join(root, 'previews', `${productCode}_R1.svg`);
  fs.writeFileSync(previewPath, renderSvg(analysis));

  const transaction = db.transaction(() => {
    db.prepare(`
      INSERT INTO products (id, product_code, name, category, subcategory, language, legal_status, active_revision_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(productId, productCode, productName, category || null, subcategory || null, language || null, legalStatus || 'review_required', revisionId);

    db.prepare(`
      INSERT INTO product_revisions (
        id, product_id, revision_number, original_filename, stored_path, sha256,
        width_mm, height_mm, entity_count, total_cut_length_mm, pierce_estimate,
        closed_path_count, open_path_count, small_feature_count, duplicate_entity_count,
        unsupported_entity_count, fits_machine, validation_status, validation_json, preview_path
      ) VALUES (?, ?, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      revisionId, productId, originalname, storedPath, sha256(buffer),
      analysis.width_mm, analysis.height_mm, analysis.entity_count, analysis.total_cut_length_mm,
      analysis.pierce_estimate, analysis.closed_path_count, analysis.open_path_count,
      analysis.small_feature_count, analysis.duplicate_entity_count, analysis.unsupported_entity_count,
      analysis.fits_machine == null ? null : Number(analysis.fits_machine), analysis.validation_status,
      JSON.stringify({ issues: analysis.issues, bounds: analysis.bounds, units: analysis.units }), previewPath
    );
  });
  transaction();
  writeProductSnapshot(db, productId, root);
  return getProduct(db, productId);
}

export function getProduct(db, productId) {
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(productId);
  if (!product) return null;
  const revisions = db.prepare('SELECT * FROM product_revisions WHERE product_id = ? ORDER BY revision_number DESC').all(productId)
    .map(r => ({ ...r, validation: JSON.parse(r.validation_json || '{}') }));
  const costs = db.prepare('SELECT * FROM product_costs WHERE product_id = ? ORDER BY effective_from DESC').all(productId);
  const production = db.prepare('SELECT * FROM production_runs WHERE product_id = ? ORDER BY created_at DESC LIMIT 100').all(productId);
  const sales = db.prepare('SELECT * FROM sales_events WHERE product_id = ? ORDER BY sold_at DESC LIMIT 100').all(productId);
  const bom = db.prepare(`SELECT b.*,i.name inventory_name,i.unit inventory_unit,i.unit_cost inventory_unit_cost FROM product_bom b JOIN inventory_items i ON i.id=b.inventory_item_id WHERE b.product_id=? ORDER BY i.name`).all(productId);
  return { ...product, revisions, costs, production, sales, bom };
}

export function listProducts(db) {
  return db.prepare(`
    SELECT p.*, r.width_mm, r.height_mm, r.validation_status, r.fits_machine, r.preview_path
    FROM products p LEFT JOIN product_revisions r ON r.id = p.active_revision_id
    ORDER BY p.created_at DESC
  `).all();
}
