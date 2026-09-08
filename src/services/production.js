import { id } from '../util/id.js';
import { moveInventory, createInventoryItem } from '../inventory/inventory-service.js';

function finishedStockItem(db, productId) {
  let item = db.prepare("SELECT * FROM inventory_items WHERE active=1 AND kind='finished_product' AND linked_product_id=? ORDER BY created_at LIMIT 1").get(productId);
  if (item) return item;
  const p = db.prepare('SELECT product_code,name FROM products WHERE id=?').get(productId);
  if (!p) return null;
  return createInventoryItem(db, {
    kind: 'finished_product',
    sku: p.product_code,
    name: p.name,
    unit: 'each',
    quantity_on_hand: 0,
    quantity_reserved: 0,
    reorder_point: null,
    unit_cost: null,
    currency: 'GBP',
    linked_product_id: productId
  });
}

export function recordProductionRun(db,input){
  const runId=id('RUN');
  const qty=Number(input.quantity||1);
  const consumed=input.material_quantity_consumed==null?null:Number(input.material_quantity_consumed);
  const consumeBom=input.consume_bom!==false;
  const tx=db.transaction(()=>{
    db.prepare(`INSERT INTO production_runs (
      id,product_id,revision_id,machine_id,quantity,material_inventory_item_id,material_quantity_consumed,
      cut_seconds,cleanup_seconds,finishing_seconds,packaging_seconds,success,failure_reason,notes
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
      runId,input.product_id,input.revision_id||null,input.machine_id||null,qty,input.material_inventory_item_id||null,consumed,
      input.cut_seconds??null,input.cleanup_seconds??null,input.finishing_seconds??null,input.packaging_seconds??null,
      input.success===false?0:1,input.failure_reason||null,input.notes||null
    );

    const explicitlyConsumed=new Set();
    if(input.material_inventory_item_id&&consumed&&consumed>0){
      moveInventory(db,{inventory_item_id:input.material_inventory_item_id,movement_type:'consume',quantity:consumed,reference_type:'production_run',reference_id:runId,notes:`Explicit material consumption for production run ${runId}`});
      explicitlyConsumed.add(input.material_inventory_item_id);
    }

    if(consumeBom){
      const bom=db.prepare('SELECT inventory_item_id,quantity_per_unit,notes FROM product_bom WHERE product_id=? ORDER BY id').all(input.product_id);
      for(const line of bom){
        if(explicitlyConsumed.has(line.inventory_item_id))continue;
        const amount=Number(line.quantity_per_unit||0)*qty;
        if(amount>0)moveInventory(db,{inventory_item_id:line.inventory_item_id,movement_type:'consume',quantity:amount,reference_type:'production_run',reference_id:runId,notes:`BOM consumption for ${qty} unit(s) in ${runId}${line.notes?`: ${line.notes}`:''}`});
      }
    }

    if(input.success!==false){
      const finished=finishedStockItem(db,input.product_id);
      if(finished)moveInventory(db,{inventory_item_id:finished.id,movement_type:'produce',quantity:qty,reference_type:'production_run',reference_id:runId,notes:`Finished stock produced by ${runId}`});
    }
  });
  tx();return db.prepare('SELECT * FROM production_runs WHERE id=?').get(runId);
}
