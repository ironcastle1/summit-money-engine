import { id } from '../util/id.js';
import { moveInventory } from '../inventory/inventory-service.js';

export function recordProductionRun(db,input){
  const runId=id('RUN');
  const qty=Number(input.quantity||1);
  const consumed=input.material_quantity_consumed==null?null:Number(input.material_quantity_consumed);
  const tx=db.transaction(()=>{
    db.prepare(`INSERT INTO production_runs (
      id,product_id,revision_id,machine_id,quantity,material_inventory_item_id,material_quantity_consumed,
      cut_seconds,cleanup_seconds,finishing_seconds,packaging_seconds,success,failure_reason,notes
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
      runId,input.product_id,input.revision_id||null,input.machine_id||null,qty,input.material_inventory_item_id||null,consumed,
      input.cut_seconds??null,input.cleanup_seconds??null,input.finishing_seconds??null,input.packaging_seconds??null,
      input.success===false?0:1,input.failure_reason||null,input.notes||null
    );
    if(input.material_inventory_item_id&&consumed&&consumed>0){
      moveInventory(db,{inventory_item_id:input.material_inventory_item_id,movement_type:'consume',quantity:consumed,reference_type:'production_run',reference_id:runId,notes:`Consumed by production run ${runId}`});
    }
  });
  tx();return db.prepare('SELECT * FROM production_runs WHERE id=?').get(runId);
}
