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
  for (const dir of ['master','revisions','previews','photos','listings','production','costing','documents','assets']) {
    fs.mkdirSync(path.join(root, dir), { recursive: true });
  }
  return root;
}

function serialiseRevision(r) {
  let validation = {};
  try { validation = JSON.parse(r.validation_json || '{}'); } catch {}
  return { ...r, validation };
}

export function syncProductSnapshot(db, productId) {
  const p = db.prepare('SELECT product_code FROM products WHERE id=?').get(productId);
  if (!p) return;
  const root = makeProductFolders(p.product_code);
  const product = getProduct(db, productId);
  fs.writeFileSync(path.join(root, 'product.json'), JSON.stringify(product, null, 2));
}

export function ingestDxf(db, { buffer, originalname, name, category, subcategory, language, legalStatus, unitOverride = null, primaryMaterialId = null }) {
  const text = buffer.toString('utf8');
  const machine = db.prepare('SELECT * FROM machines WHERE active = 1 ORDER BY created_at LIMIT 1').get();
  const analysis = analyseDxfText(text, machine, { unitOverride });

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

  const unitsConfirmed = Boolean(analysis.units.mm_per_unit);
  const tx = db.transaction(() => {
    db.prepare(`INSERT INTO products (
      id,product_code,name,category,subcategory,language,legal_status,active_revision_id,primary_material_inventory_item_id
    ) VALUES (?,?,?,?,?,?,?,?,?)`).run(
      productId, productCode, productName, category || null, subcategory || null, language || null,
      legalStatus || 'review_required', revisionId, primaryMaterialId || null
    );

    db.prepare(`INSERT INTO product_revisions (
      id,product_id,revision_number,original_filename,stored_path,sha256,width_mm,height_mm,
      drawing_width_units,drawing_height_units,unit_code,unit_name,mm_per_unit,units_confirmed,
      entity_count,total_cut_length_mm,pierce_estimate,closed_path_count,open_path_count,small_feature_count,
      duplicate_entity_count,unsupported_entity_count,fits_machine,validation_status,validation_json,preview_path
    ) VALUES (?,?,1,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
      revisionId, productId, originalname, storedPath, sha256(buffer), analysis.width_mm, analysis.height_mm,
      analysis.drawing_width_units, analysis.drawing_height_units, analysis.units.code, analysis.units.name,
      analysis.units.mm_per_unit, Number(unitsConfirmed), analysis.entity_count, analysis.total_cut_length_mm,
      analysis.pierce_estimate, analysis.closed_path_count, analysis.open_path_count, analysis.small_feature_count,
      analysis.duplicate_entity_count, analysis.unsupported_entity_count,
      analysis.fits_machine == null ? null : Number(analysis.fits_machine), analysis.validation_status,
      JSON.stringify({ issues: analysis.issues, bounds: analysis.bounds, drawing_bounds: analysis.drawing_bounds, units: analysis.units }), previewPath
    );
  });
  tx();
  syncProductSnapshot(db, productId);
  return getProduct(db, productId);
}


export function addDxfRevision(db, productId, { buffer, originalname, unitOverride = null }) {
  const product = db.prepare('SELECT * FROM products WHERE id=?').get(productId);
  if (!product) throw Object.assign(new Error('Product not found'), { status: 404 });
  const machine = db.prepare('SELECT * FROM machines WHERE active = 1 ORDER BY created_at LIMIT 1').get();
  const text = buffer.toString('utf8');
  const analysis = analyseDxfText(text, machine, { unitOverride });
  const next = Number(db.prepare('SELECT COALESCE(MAX(revision_number),0)+1 n FROM product_revisions WHERE product_id=?').get(productId).n || 1);
  const revisionId = id('REV');
  const root = makeProductFolders(product.product_code);
  const storedName = `R${next}_${safeFilename(originalname)}`;
  const storedPath = path.join(root, 'revisions', storedName);
  fs.writeFileSync(storedPath, buffer);
  const previewPath = path.join(root, 'previews', `${product.product_code}_R${next}.svg`);
  fs.writeFileSync(previewPath, renderSvg(analysis));
  const unitsConfirmed = Boolean(analysis.units.mm_per_unit);
  const tx = db.transaction(() => {
    db.prepare(`INSERT INTO product_revisions (
      id,product_id,revision_number,original_filename,stored_path,sha256,width_mm,height_mm,
      drawing_width_units,drawing_height_units,unit_code,unit_name,mm_per_unit,units_confirmed,
      entity_count,total_cut_length_mm,pierce_estimate,closed_path_count,open_path_count,small_feature_count,
      duplicate_entity_count,unsupported_entity_count,fits_machine,validation_status,validation_json,preview_path
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
      revisionId, productId, next, originalname, storedPath, sha256(buffer), analysis.width_mm, analysis.height_mm,
      analysis.drawing_width_units, analysis.drawing_height_units, analysis.units.code, analysis.units.name,
      analysis.units.mm_per_unit, Number(unitsConfirmed), analysis.entity_count, analysis.total_cut_length_mm,
      analysis.pierce_estimate, analysis.closed_path_count, analysis.open_path_count, analysis.small_feature_count,
      analysis.duplicate_entity_count, analysis.unsupported_entity_count,
      analysis.fits_machine == null ? null : Number(analysis.fits_machine), analysis.validation_status,
      JSON.stringify({ issues: analysis.issues, bounds: analysis.bounds, drawing_bounds: analysis.drawing_bounds, units: analysis.units }), previewPath
    );
    db.prepare('UPDATE products SET active_revision_id=?,status=?,updated_at=CURRENT_TIMESTAMP WHERE id=?').run(revisionId,'imported',productId);
  });
  tx();
  syncProductSnapshot(db, productId);
  return getProduct(db, productId);
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
    total_cut_length_mm=?,pierce_estimate=?,closed_path_count=?,open_path_count=?,small_feature_count=?,duplicate_entity_count=?,
    unsupported_entity_count=?,fits_machine=?,validation_status=?,validation_json=? WHERE id=?`).run(
      analysis.width_mm, analysis.height_mm, analysis.drawing_width_units, analysis.drawing_height_units,
      analysis.units.code, analysis.units.name, analysis.units.mm_per_unit, Number(Boolean(analysis.units.mm_per_unit)),
      analysis.total_cut_length_mm, analysis.pierce_estimate, analysis.closed_path_count, analysis.open_path_count,
      analysis.small_feature_count, analysis.duplicate_entity_count, analysis.unsupported_entity_count,
      analysis.fits_machine == null ? null : Number(analysis.fits_machine), analysis.validation_status,
      JSON.stringify({ issues: analysis.issues, bounds: analysis.bounds, drawing_bounds: analysis.drawing_bounds, units: analysis.units }), revisionId
    );
  syncProductSnapshot(db, rev.product_id);
  return serialiseRevision(db.prepare('SELECT * FROM product_revisions WHERE id=?').get(revisionId));
}

export function updateProduct(db, productId, input) {
  const current = db.prepare('SELECT * FROM products WHERE id=?').get(productId);
  if (!current) return null;
  db.prepare(`UPDATE products SET name=?,category=?,subcategory=?,language=?,status=?,legal_status=?,notes=?,
    primary_material_inventory_item_id=?,target_width_mm=?,target_height_mm=?,selling_price=?,updated_at=CURRENT_TIMESTAMP WHERE id=?`).run(
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
  const bom = db.prepare(`SELECT b.*,i.name inventory_name,i.unit inventory_unit,i.unit_cost inventory_unit_cost
    FROM product_bom b JOIN inventory_items i ON i.id=b.inventory_item_id WHERE b.product_id=? ORDER BY i.name`).all(productId);
  const assets = db.prepare('SELECT * FROM product_assets WHERE product_id=? ORDER BY created_at DESC').all(productId);
  return { ...product, revisions, costs, production, sales, bom, assets };
}

export function listProducts(db) {
  return db.prepare(`
    SELECT p.*,r.width_mm,r.height_mm,r.drawing_width_units,r.drawing_height_units,r.unit_name,r.units_confirmed,
      r.validation_status,r.fits_machine,r.preview_path,r.id revision_id,i.name primary_material_name,i.thickness_mm primary_material_thickness_mm
    FROM products p
    LEFT JOIN product_revisions r ON r.id=p.active_revision_id
    LEFT JOIN inventory_items i ON i.id=p.primary_material_inventory_item_id
    ORDER BY p.created_at DESC
  `).all();
}
