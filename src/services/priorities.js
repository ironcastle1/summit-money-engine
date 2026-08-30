export function currentPriorities(db, limit = 12) {
  const out = [];
  const add = (kind, title, reason, reference_type = null, reference_id = null) => out.push({ kind, title, reason, reference_type, reference_id });

  const overdue = db.prepare("SELECT id,external_order_id,customer_reference,due_at FROM orders WHERE status NOT IN ('dispatched','cancelled') AND due_at IS NOT NULL AND datetime(due_at)<datetime('now') ORDER BY due_at LIMIT 20").all();
  for (const o of overdue) add('overdue_order', `Complete overdue order ${o.external_order_id || o.id}`, `Its recorded due date ${o.due_at} has passed and the order is still open.`, 'order', o.id);

  const due = db.prepare("SELECT id,external_order_id,due_at FROM orders WHERE status NOT IN ('dispatched','cancelled') AND due_at IS NOT NULL AND date(due_at)=date('now','localtime') ORDER BY due_at LIMIT 20").all();
  for (const o of due) if (!overdue.some(x=>x.id===o.id)) add('due_today', `Work on order ${o.external_order_id || o.id}`, 'It is recorded as due today.', 'order', o.id);

  const low = db.prepare(`SELECT id,name,unit,(quantity_on_hand-quantity_reserved) available,reorder_point FROM inventory_items
    WHERE active=1 AND reorder_point IS NOT NULL AND (quantity_on_hand-quantity_reserved)<=reorder_point
    ORDER BY ((quantity_on_hand-quantity_reserved)-reorder_point) LIMIT 20`).all();
  for (const i of low) add('low_stock', `Check stock: ${i.name}`, `${i.available} ${i.unit} is available and the recorded reorder point is ${i.reorder_point} ${i.unit}.`, 'inventory_item', i.id);

  const untested = db.prepare(`SELECT id,product_code,name,status FROM products WHERE status IN ('imported','prototype_required') ORDER BY created_at LIMIT 8`).all();
  for (const p of untested) add('product_validation', `Validate ${p.product_code} — ${p.name}`, `The product exists in MERLIN but its recorded state is ${p.status}; no production-ready conclusion should be assumed.`, 'product', p.id);

  const unpriced = db.prepare(`SELECT id,product_code,name FROM products WHERE selling_price IS NULL ORDER BY created_at LIMIT 6`).all();
  for (const p of unpriced) add('missing_price', `Establish price inputs for ${p.product_code}`, 'No selling price is recorded. MERLIN cannot calculate commercial performance without real pricing/cost inputs.', 'product', p.id);

  const researchCount = db.prepare('SELECT COUNT(*) n FROM collected_market_items').get().n;
  if (!researchCount) add('market_evidence', 'Run the first market scan', 'MERLIN currently has no collected public market evidence. A scan can establish current source material without assuming demand.');

  const productCount = db.prepare('SELECT COUNT(*) n FROM products').get().n;
  const nonWall = db.prepare("SELECT COUNT(*) n FROM products WHERE lower(COALESCE(category,'')) NOT LIKE '%wall%' AND lower(COALESCE(category,'')) NOT LIKE '%art%'").get().n;
  if (productCount >= 5 && nonWall === 0) add('catalogue_balance', 'Test one non-wall-art product family', 'Every currently recorded product is wall-art/art weighted. The owner has explicitly asked MERLIN to investigate repeatable numbers, letters, signs, monograms and other non-wall-art revenue lines.');

  return out.slice(0, Math.min(30, Math.max(1, Number(limit || 12))));
}
