import { id } from '../util/id.js';
import { moveInventory } from '../inventory/inventory-service.js';

export function recordSale(db, input) {
  const sid = id('SALE');
  const qty = Number(input.quantity || 1);
  db.prepare(`INSERT INTO sales_events (
    id,product_id,channel,quantity,gross_revenue,fees,shipping_income,shipping_cost,refunds,currency,sold_at,notes
  ) VALUES (?,?,?,?,?,?,?,?,?,?,COALESCE(?,CURRENT_TIMESTAMP),?)`).run(
    sid,input.product_id||null,input.channel||null,qty,input.gross_revenue??null,input.fees??null,
    input.shipping_income??null,input.shipping_cost??null,input.refunds??null,input.currency||'GBP',input.sold_at||null,input.notes||null
  );

  let stockMovement = null;
  let stockWarning = null;
  if (input.product_id && input.consume_finished_stock !== false) {
    const stock = db.prepare("SELECT * FROM inventory_items WHERE active=1 AND kind='finished_product' AND linked_product_id=? ORDER BY created_at LIMIT 1").get(input.product_id);
    if (stock) {
      const available = Number(stock.quantity_on_hand||0)-Number(stock.quantity_reserved||0);
      if (available >= qty) {
        stockMovement = moveInventory(db,{inventory_item_id:stock.id,movement_type:'consume',quantity:qty,reference_type:'sale',reference_id:sid,notes:`Finished stock sold in ${sid}`});
      } else if (available > 0) {
        stockWarning = `Only ${available} finished unit(s) were recorded on hand, so MERLIN did not automatically reduce stock for a sale of ${qty}.`;
      } else {
        stockWarning = 'No finished stock was recorded on hand, so the sale was recorded without changing finished inventory.';
      }
    }
  }
  return { ...db.prepare('SELECT * FROM sales_events WHERE id=?').get(sid), stock_movement:stockMovement?.movement||null, stock_warning:stockWarning };
}

export function productPerformance(db, productId) {
  const sales = db.prepare(`SELECT
    COALESCE(SUM(quantity),0) units_sold,
    COALESCE(SUM(gross_revenue),0) gross_revenue,
    COALESCE(SUM(fees),0) fees,
    COALESCE(SUM(shipping_cost),0) shipping_cost,
    COALESCE(SUM(refunds),0) refunds,
    COUNT(*) sale_events
    FROM sales_events WHERE product_id=?`).get(productId);
  const production = db.prepare(`SELECT
    COUNT(*) run_count,
    COALESCE(SUM(quantity),0) units_recorded,
    AVG(cut_seconds) avg_cut_seconds,
    AVG(cleanup_seconds) avg_cleanup_seconds,
    AVG(finishing_seconds) avg_finishing_seconds,
    AVG(packaging_seconds) avg_packaging_seconds,
    SUM(CASE WHEN success=0 THEN 1 ELSE 0 END) failed_runs
    FROM production_runs WHERE product_id=?`).get(productId);
  const latestCost = db.prepare('SELECT * FROM product_costs WHERE product_id=? ORDER BY effective_from DESC LIMIT 1').get(productId) || null;
  return { product_id: productId, sales, production, latest_cost: latestCost };
}
