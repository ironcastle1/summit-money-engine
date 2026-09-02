import { id } from '../util/id.js';
import { parseIntakeText, normaliseIntakeText } from './parser.js';
import { createInventoryItem, moveInventory, updateInventoryItem } from '../inventory/inventory-service.js';
import { recordSale } from '../services/sales.js';
import { recordProductionRun } from '../services/production.js';
import { syncProductSnapshot, updateProduct } from '../products/product-service.js';

function exactProduct(db, fields){
  if(fields.product_code){
    const p=db.prepare('SELECT * FROM products WHERE upper(product_code)=upper(?)').get(fields.product_code);
    return p ? {product:p, ambiguity:null} : {product:null, ambiguity:`No product exists with code ${fields.product_code}.`};
  }
  if(fields.product_name){
    const rows=db.prepare('SELECT * FROM products WHERE lower(name)=lower(?) ORDER BY created_at DESC').all(fields.product_name);
    if(rows.length===1)return {product:rows[0],ambiguity:null};
    if(rows.length>1)return {product:null,ambiguity:`More than one product is named ${fields.product_name}; use the short product code.`};
    return {product:null,ambiguity:`No exact product name match exists for ${fields.product_name}; use the short product code.`};
  }
  return {product:null,ambiguity:'No product reference was supplied.'};
}
function exactInventory(db,name){
  if(!name)return {item:null,ambiguity:'No inventory item was supplied.'};
  const rows=db.prepare('SELECT * FROM inventory_items WHERE active=1 AND lower(name)=lower(?) ORDER BY created_at').all(name);
  if(rows.length===1)return {item:rows[0],ambiguity:null};
  if(rows.length>1)return {item:null,ambiguity:`More than one inventory item is named ${name}.`};
  return {item:null,ambiguity:`No exact inventory item exists named ${name}.`};
}
function event(db,type,title,detail,referenceType=null,referenceId=null){
  const eid=id('EVT');db.prepare('INSERT INTO business_events (id,event_type,title,detail,reference_type,reference_id) VALUES (?,?,?,?,?,?)').run(eid,type,title,detail||null,referenceType,referenceId);return eid;
}
function saveDraft(db,raw,parsed){
  const iid=id('INTAKE');
  db.prepare(`INSERT INTO intake_records (id,raw_text,action,status,parsed_json,missing_json,notes_json) VALUES (?,?,?,?,?,?,?)`).run(
    iid,raw,parsed.action,parsed.can_commit?'ready':'needs_input',JSON.stringify(parsed.fields||{}),JSON.stringify(parsed.missing_fields||[]),JSON.stringify(parsed.notes||[])
  );
  return iid;
}
function readIntake(db,iid){
  const r=db.prepare('SELECT * FROM intake_records WHERE id=?').get(iid);if(!r)return null;
  for(const [src,dst,fb] of [['parsed_json','fields',{}],['missing_json','missing_fields',[]],['notes_json','notes',[]],['result_json','result',null]]){
    try{r[dst]=JSON.parse(r[src]||JSON.stringify(fb));}catch{r[dst]=fb;}
  }
  return r;
}

export function parseAndStoreIntake(db,text){
  const raw=normaliseIntakeText(text);const parsed=parseIntakeText(raw);const intakeId=saveDraft(db,raw,parsed);
  // Resolve exact product references before presenting the draft.
  let resolution={};
  if(['sale','production_run','product_price'].includes(parsed.action)&&(parsed.fields.product_code||parsed.fields.product_name)){
    const r=exactProduct(db,parsed.fields);resolution.product=r.product?{id:r.product.id,product_code:r.product.product_code,name:r.product.name}:null;
    if(r.ambiguity){parsed.can_commit=false;parsed.missing_fields=[...new Set([...(parsed.missing_fields||[]),'exact_product_match'])];parsed.notes=[...(parsed.notes||[]),r.ambiguity];}
    else parsed.fields.product_id=r.product.id;
  }
  db.prepare('UPDATE intake_records SET status=?,parsed_json=?,missing_json=?,notes_json=? WHERE id=?').run(parsed.can_commit?'ready':'needs_input',JSON.stringify(parsed.fields),JSON.stringify(parsed.missing_fields),JSON.stringify(parsed.notes),intakeId);
  return {...parsed,intake_id:intakeId,resolution};
}


function matchingInventoryForPurchase(db,f){
  if(f.kind==='raw_material'){
    return db.prepare(`SELECT * FROM inventory_items WHERE active=1 AND kind='raw_material' AND unit=?
      AND COALESCE(material_family,'')=COALESCE(?, '') AND COALESCE(thickness_mm,-1)=COALESCE(?, -1)
      AND COALESCE(width_mm,-1)=COALESCE(?, -1) AND COALESCE(height_mm,-1)=COALESCE(?, -1)
      ORDER BY created_at LIMIT 1`).get(f.unit||'sheet',f.material_family||null,f.thickness_mm,f.width_mm,f.height_mm)||null;
  }
  return db.prepare('SELECT * FROM inventory_items WHERE active=1 AND kind=? AND lower(name)=lower(?) AND unit=? ORDER BY created_at LIMIT 1').get(f.kind,f.name,f.unit)||null;
}

function recordPurchaseTables(db,item,fields){
  if(fields.total_cost==null)return null;
  const pid=id('PUR');
  db.prepare('INSERT INTO purchases (id,total_cost,currency,notes) VALUES (?,?,?,?)').run(pid,fields.total_cost,fields.currency||'GBP',`Recorded through Tell MERLIN: ${fields.source_text}`);
  db.prepare('INSERT INTO purchase_lines (id,purchase_id,inventory_item_id,description,quantity,unit_cost,line_total) VALUES (?,?,?,?,?,?,?)').run(id('PLINE'),pid,item.id,item.name,fields.quantity,item.unit_cost,fields.total_cost);
  return pid;
}

export function commitIntake(db,intakeId){
  const row=readIntake(db,intakeId);if(!row)throw Object.assign(new Error('Intake record not found'),{status:404});
  if(row.status==='committed')return row;
  if(row.status!=='ready'||row.missing_fields.length)throw Object.assign(new Error(`This statement is not ready to record. Missing: ${row.missing_fields.join(', ')||'clarification'}`),{status:409});
  const f=row.fields;let result=null;
  const tx=db.transaction(()=>{
    if(row.action==='inventory_material_purchase'||row.action==='inventory_supply_purchase'){
      let item=matchingInventoryForPurchase(db,f);
      if(!item)item=createInventoryItem(db,{kind:f.kind,name:f.name,unit:f.unit,quantity_on_hand:0,unit_cost:f.unit_cost,currency:f.currency||'GBP',material_family:f.material_family||null,form:f.form||null,thickness_mm:f.thickness_mm,width_mm:f.width_mm,height_mm:f.height_mm,attributes:{intake_id:intakeId,source_text:f.source_text}});
      else if(f.unit_cost!=null)item=updateInventoryItem(db,item.id,{unit_cost:f.unit_cost});
      const moved=moveInventory(db,{inventory_item_id:item.id,movement_type:'purchase',quantity:Number(f.quantity||0),unit_cost:f.unit_cost,reference_type:'intake',reference_id:intakeId,notes:`Tell MERLIN purchase: ${f.source_text}`});
      item=moved.item;
      const purchase=recordPurchaseTables(db,item,f);
      result={type:'inventory',item_id:item.id,purchase_id:purchase||null,name:item.name,quantity_added:Number(f.quantity||0),quantity_on_hand:item.quantity_on_hand,unit:item.unit,unit_cost:item.unit_cost};
      event(db,'inventory',`Stock added: ${item.name}`,`+${Number(f.quantity||0)} ${item.unit} · ${item.quantity_on_hand} now on hand${item.unit_cost==null?'':` · £${Number(item.unit_cost).toFixed(2)} each`}`,'inventory_item',item.id);
    } else if(row.action==='inventory_stocktake'){
      const r=exactInventory(db,f.inventory_name);if(!r.item)throw Object.assign(new Error(r.ambiguity),{status:409});
      const delta=Number(f.quantity_on_hand)-Number(r.item.quantity_on_hand||0);
      if(delta!==0)moveInventory(db,{inventory_item_id:r.item.id,movement_type:'adjust',quantity:delta,notes:`Stocktake through Tell MERLIN: ${f.source_text}`});
      result={type:'stocktake',item_id:r.item.id,name:r.item.name,quantity_on_hand:Number(f.quantity_on_hand)};
      event(db,'inventory',`Stocktake: ${r.item.name}`,`${f.quantity_on_hand} ${r.item.unit} on hand`,'inventory_item',r.item.id);
    } else if(row.action==='expense'){
      const eid=id('EXP');db.prepare('INSERT INTO expenses (id,category,description,amount,currency,notes) VALUES (?,?,?,?,?,?)').run(eid,f.category,f.description,Number(f.amount),f.currency||'GBP',`Tell MERLIN intake ${intakeId}`);
      result={type:'expense',expense_id:eid,amount:f.amount,description:f.description};event(db,'expense','Expense recorded',`£${Number(f.amount).toFixed(2)} · ${f.description}`,'expense',eid);
    } else if(row.action==='sale'){
      const sale=recordSale(db,{product_id:f.product_id,channel:f.channel,quantity:f.quantity,gross_revenue:f.gross_revenue,currency:f.currency||'GBP',notes:`Tell MERLIN: ${f.source_text}`});syncProductSnapshot(db,f.product_id);
      result={type:'sale',sale_id:sale.id,product_id:f.product_id,gross_revenue:f.gross_revenue};event(db,'sale','Sale recorded',`£${Number(f.gross_revenue).toFixed(2)}`,'sale',sale.id);
    } else if(row.action==='production_run'){
      const run=recordProductionRun(db,{product_id:f.product_id,quantity:f.quantity,cut_seconds:f.cut_seconds,cleanup_seconds:f.cleanup_seconds,finishing_seconds:f.finishing_seconds,packaging_seconds:f.packaging_seconds,success:f.success,notes:`Tell MERLIN: ${f.source_text}`});syncProductSnapshot(db,f.product_id);
      result={type:'production_run',run_id:run.id,product_id:f.product_id,quantity:f.quantity};event(db,'production','Production run recorded',f.source_text,'production_run',run.id);
    } else if(row.action==='product_price'){
      const p=updateProduct(db,f.product_id,{selling_price:f.selling_price});result={type:'product',product_id:p.id,product_code:p.product_code,selling_price:p.selling_price};event(db,'product',`Price updated: ${p.product_code}`,`£${Number(p.selling_price).toFixed(2)}`,'product',p.id);
    } else if(row.action==='business_note'){
      const kid=id('KNOW');db.prepare('INSERT INTO knowledge_documents (id,kind,title,body,source_ref) VALUES (?,?,?,?,?)').run(kid,'business_note','Owner note',f.body,`intake:${intakeId}`);result={type:'business_note',document_id:kid};event(db,'note','Business note recorded',f.body,'knowledge_document',kid);
    } else throw Object.assign(new Error('Unsupported intake action'),{status:400});
    db.prepare("UPDATE intake_records SET status='committed',committed_at=CURRENT_TIMESTAMP,result_json=? WHERE id=?").run(JSON.stringify(result),intakeId);
  });
  tx();return readIntake(db,intakeId);
}

export function listIntake(db,limit=50){
  const rows=db.prepare('SELECT * FROM intake_records ORDER BY created_at DESC LIMIT ?').all(Math.min(200,Math.max(1,Number(limit||50))));
  return rows.map(r=>readIntake(db,r.id));
}
