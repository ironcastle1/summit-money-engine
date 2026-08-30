import { moveInventory } from '../inventory/inventory-service.js';

export function consumeFinishedStockForDispatch(db, orderId) {
  const lines=db.prepare(`SELECT ol.product_id,ol.quantity,p.product_code,p.name FROM order_lines ol LEFT JOIN products p ON p.id=ol.product_id WHERE ol.order_id=? AND ol.product_id IS NOT NULL`).all(orderId);
  const results=[];
  for(const line of lines){
    const stock=db.prepare("SELECT * FROM inventory_items WHERE active=1 AND kind='finished_product' AND linked_product_id=? ORDER BY created_at LIMIT 1").get(line.product_id);
    if(!stock){results.push({product_id:line.product_id,product_code:line.product_code,consumed:false,reason:'No finished-stock record exists'});continue;}
    const available=Number(stock.quantity_on_hand||0)-Number(stock.quantity_reserved||0);
    if(available<Number(line.quantity||0)){results.push({product_id:line.product_id,product_code:line.product_code,consumed:false,reason:`Only ${available} available; ${line.quantity} required`});continue;}
    const move=moveInventory(db,{inventory_item_id:stock.id,movement_type:'consume',quantity:Number(line.quantity),reference_type:'order_dispatch',reference_id:orderId,notes:`Dispatched order ${orderId}`});
    results.push({product_id:line.product_id,product_code:line.product_code,consumed:true,movement_id:move.movement.id});
  }
  return results;
}
