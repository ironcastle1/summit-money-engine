import { id } from '../util/id.js';

function safeJson(value) { try { return JSON.parse(value || '{}'); } catch { return {}; } }
function n(value) { return value === '' || value == null ? null : Number(value); }

export function createInventoryItem(db, input) {
  const itemId = id('INV');
  db.prepare(`INSERT INTO inventory_items (
    id,sku,kind,name,unit,quantity_on_hand,quantity_reserved,reorder_point,unit_cost,currency,supplier_id,location,attributes_json,
    material_family,material_grade,form,thickness_mm,width_mm,height_mm,length_mm,colour,linked_product_id
  ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
    itemId,input.sku||null,input.kind,input.name,input.unit,Number(input.quantity_on_hand||0),Number(input.quantity_reserved||0),
    n(input.reorder_point),n(input.unit_cost),input.currency||'GBP',input.supplier_id||null,input.location||null,JSON.stringify(input.attributes||{}),
    input.material_family||null,input.material_grade||null,input.form||null,n(input.thickness_mm),n(input.width_mm),n(input.height_mm),n(input.length_mm),
    input.colour||null,input.linked_product_id||null
  );
  return getInventoryItem(db, itemId);
}

export function updateInventoryItem(db, itemId, input) {
  const current = db.prepare('SELECT * FROM inventory_items WHERE id=?').get(itemId);
  if (!current) return null;
  const fields = ['sku','kind','name','unit','reorder_point','unit_cost','currency','supplier_id','location','material_family','material_grade','form','thickness_mm','width_mm','height_mm','length_mm','colour','linked_product_id'];
  const values = {};
  for (const f of fields) values[f] = input[f] === undefined ? current[f] : input[f];
  db.prepare(`UPDATE inventory_items SET sku=?,kind=?,name=?,unit=?,reorder_point=?,unit_cost=?,currency=?,supplier_id=?,location=?,
    material_family=?,material_grade=?,form=?,thickness_mm=?,width_mm=?,height_mm=?,length_mm=?,colour=?,linked_product_id=?,updated_at=CURRENT_TIMESTAMP WHERE id=?`).run(
      values.sku||null,values.kind,values.name,values.unit,n(values.reorder_point),n(values.unit_cost),values.currency||'GBP',values.supplier_id||null,values.location||null,
      values.material_family||null,values.material_grade||null,values.form||null,n(values.thickness_mm),n(values.width_mm),n(values.height_mm),n(values.length_mm),values.colour||null,values.linked_product_id||null,itemId
    );
  return getInventoryItem(db,itemId);
}

export function getInventoryItem(db, itemId) {
  const row = db.prepare('SELECT * FROM inventory_items WHERE id=?').get(itemId);
  if (!row) return null;
  return { ...row, available_quantity: Number(row.quantity_on_hand||0)-Number(row.quantity_reserved||0), attributes: safeJson(row.attributes_json) };
}

export function moveInventory(db, input) {
  const item = db.prepare('SELECT * FROM inventory_items WHERE id=?').get(input.inventory_item_id);
  if (!item) throw Object.assign(new Error('Inventory item not found'), { status: 404 });
  const qty = Number(input.quantity);
  if (!Number.isFinite(qty) || qty === 0) throw Object.assign(new Error('Quantity must be non-zero'), { status: 400 });
  if (input.movement_type !== 'adjust' && qty < 0) throw Object.assign(new Error('Quantity must be > 0 for this movement type'), { status: 400 });

  let onHand = Number(item.quantity_on_hand || 0);
  let reserved = Number(item.quantity_reserved || 0);
  const type = input.movement_type;
  if (['purchase','produce','return','adjust'].includes(type)) onHand += qty;
  else if (['consume','scrap'].includes(type)) onHand -= qty;
  else if (type === 'reserve') reserved += qty;
  else if (type === 'release') reserved -= qty;
  else throw Object.assign(new Error('Unsupported inventory movement type'), { status: 400 });

  if (onHand < 0 && !input.allow_negative) throw Object.assign(new Error('Movement would make physical stock negative'), { status: 409 });
  if (reserved < 0) throw Object.assign(new Error('Cannot release more stock than is reserved'), { status: 409 });
  if (reserved > onHand && !input.allow_negative) throw Object.assign(new Error('Cannot reserve more stock than is physically on hand'), { status: 409 });

  const movementId = id('MOV');
  const tx = db.transaction(() => {
    db.prepare(`INSERT INTO inventory_movements (id,inventory_item_id,movement_type,quantity,unit_cost,reference_type,reference_id,notes)
      VALUES (?,?,?,?,?,?,?,?)`).run(movementId,item.id,type,qty,input.unit_cost??null,input.reference_type||null,input.reference_id||null,input.notes||null);
    db.prepare('UPDATE inventory_items SET quantity_on_hand=?,quantity_reserved=?,updated_at=CURRENT_TIMESTAMP WHERE id=?').run(onHand,reserved,item.id);
  });
  tx();
  return { movement: db.prepare('SELECT * FROM inventory_movements WHERE id=?').get(movementId), item: getInventoryItem(db,item.id) };
}

export function listInventory(db) {
  return db.prepare('SELECT * FROM inventory_items WHERE active=1 ORDER BY kind,name').all().map((row)=>({
    ...row,
    available_quantity: Number(row.quantity_on_hand||0)-Number(row.quantity_reserved||0),
    attributes: safeJson(row.attributes_json)
  }));
}

export function inventoryAlerts(db) {
  return db.prepare(`SELECT *,(quantity_on_hand-quantity_reserved) available_quantity FROM inventory_items
    WHERE active=1 AND reorder_point IS NOT NULL AND (quantity_on_hand-quantity_reserved) <= reorder_point
    ORDER BY ((quantity_on_hand-quantity_reserved)-reorder_point) ASC`).all();
}
