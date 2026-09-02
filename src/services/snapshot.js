function safeJson(v, fallback={}) { try { return JSON.parse(v || JSON.stringify(fallback)); } catch { return fallback; } }

export function businessSnapshot(db) {
  const profile = db.prepare('SELECT * FROM business_profile WHERE id=1').get();
  const machines = db.prepare('SELECT * FROM machines WHERE active=1').all().map(m => ({...m, rules: safeJson(m.rules_json)}));
  const capabilities = db.prepare("SELECT * FROM capabilities WHERE status='active' ORDER BY name").all().map(c => ({...c, details: safeJson(c.details_json)}));
  const facts = db.prepare('SELECT category,fact_key,fact_value,source,confidence FROM memory_facts WHERE active=1 ORDER BY category,fact_key').all();
  const inventory = db.prepare(`SELECT id,sku,kind,name,unit,quantity_on_hand,quantity_reserved,
    (quantity_on_hand-quantity_reserved) available_quantity,reorder_point,unit_cost,currency,location,
    material_family,material_grade,form,thickness_mm,width_mm,height_mm,length_mm,colour
    FROM inventory_items WHERE active=1 ORDER BY kind,name`).all();
  const productCounts = db.prepare('SELECT status,COUNT(*) count FROM products GROUP BY status').all();
  const products = db.prepare(`SELECT p.id,p.product_code,p.name,p.category,p.subcategory,p.language,p.status,p.legal_status,
    p.target_width_mm,p.target_height_mm,p.selling_price,p.primary_material_inventory_item_id,
    i.name primary_material_name,r.validation_status,r.width_mm,r.height_mm,r.units_confirmed,r.unit_name,r.drawing_width_units,r.drawing_height_units
    FROM products p LEFT JOIN product_revisions r ON r.id=p.active_revision_id
    LEFT JOIN inventory_items i ON i.id=p.primary_material_inventory_item_id
    ORDER BY p.created_at DESC LIMIT 250`).all();
  const recentRuns = db.prepare(`SELECT pr.*,p.product_code,p.name product_name FROM production_runs pr LEFT JOIN products p ON p.id=pr.product_id ORDER BY pr.created_at DESC LIMIT 50`).all();
  const recentSales = db.prepare(`SELECT s.*,p.product_code,p.name product_name FROM sales_events s LEFT JOIN products p ON p.id=s.product_id ORDER BY sold_at DESC LIMIT 50`).all();
  const recentMarket = db.prepare('SELECT id,topic,observation,why_valuable,unknowns_json,suggested_test,created_at FROM market_observations WHERE applicable_now=1 ORDER BY created_at DESC LIMIT 20').all().map(o=>({...o,unknowns:safeJson(o.unknowns_json,[])}));
  return { profile,machines,capabilities,facts,inventory,productCounts,products,recentRuns,recentSales,recentMarket };
}
