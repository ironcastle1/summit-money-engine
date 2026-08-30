import { id } from '../util/id.js';

export function createInventoryItem(db, input) {
  const itemId = id('INV');
  db.prepare(`
    INSERT INTO inventory_items (
      id, sku, kind, name, unit, quantity_on_hand, reorder_point, unit_cost, currency,
      supplier_id, location, attributes_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    itemId,
    input.sku || null,
    input.kind,
    input.name,
    input.unit,
    Number(input.quantity_on_hand || 0),
    input.reorder_point == null ? null : Number(input.reorder_point),
    input.unit_cost == null ? null : Number(input.unit_cost),
    input.currency || 'GBP',
    input.supplier_id || null,
    input.location || null,
    JSON.stringify(input.attributes || {})
  );
  return db.prepare('SELECT * FROM inventory_items WHERE id=?').get(itemId);
}

export function moveInventory(db, input) {
  const item = db.prepare('SELECT * FROM inventory_items WHERE id=?').get(input.inventory_item_id);
  if (!item) throw Object.assign(new Error('Inventory item not found'), { status: 404 });
  const qty = Number(input.quantity);
  if (!Number.isFinite(qty) || qty <= 0) throw Object.assign(new Error('Quantity must be > 0'), { status: 400 });

  const signed = ['consume','reserve','scrap'].includes(input.movement_type) ? -qty : qty;
  const next = Number(item.quantity_on_hand) + signed;
  if (next < 0 && !input.allow_negative) throw Object.assign(new Error('Movement would make stock negative'), { status: 409 });

  const movementId = id('MOV');
  const tx = db.transaction(() => {
    db.prepare(`INSERT INTO inventory_movements
      (id, inventory_item_id, movement_type, quantity, unit_cost, reference_type, reference_id, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(movementId, item.id, input.movement_type, qty, input.unit_cost ?? null, input.reference_type || null, input.reference_id || null, input.notes || null);
    db.prepare('UPDATE inventory_items SET quantity_on_hand=?, updated_at=CURRENT_TIMESTAMP WHERE id=?').run(next, item.id);
  });
  tx();
  return { movement: db.prepare('SELECT * FROM inventory_movements WHERE id=?').get(movementId), item: db.prepare('SELECT * FROM inventory_items WHERE id=?').get(item.id) };
}

export function listInventory(db) {
  return db.prepare('SELECT * FROM inventory_items WHERE active=1 ORDER BY kind, name').all();
}

export function inventoryAlerts(db) {
  return db.prepare(`
    SELECT * FROM inventory_items
    WHERE active=1 AND reorder_point IS NOT NULL AND quantity_on_hand <= reorder_point
    ORDER BY (quantity_on_hand - reorder_point) ASC
  `).all();
}
