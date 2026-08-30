import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import { ingestDxf, getProduct, listProducts, syncProductSnapshot, updateProduct, reconfirmRevisionUnits } from '../products/product-service.js';
import { createInventoryItem, moveInventory, listInventory, inventoryAlerts, updateInventoryItem, getInventoryItem } from '../inventory/inventory-service.js';
import { businessSnapshot } from '../services/snapshot.js';
import { upsertFact } from '../services/memory.js';
import { chatWithMerlin } from '../ai/chat.js';
import { runMarketResearch } from '../market/research.js';
import { id } from '../util/id.js';
import { recordSale, productPerformance } from '../services/sales.js';
import { recordProductionRun } from '../services/production.js';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });
const ORDER_STATUSES = ['new','confirmed','queued','cutting','deburring','surface_prep','painting','curing','qc','packing','ready','dispatched','cancelled'];

function asyncRoute(fn) { return (req,res,next)=>Promise.resolve(fn(req,res,next)).catch(next); }
function requireAutomationToken(req,res,next) {
  const configured=process.env.MERLIN_AUTOMATION_TOKEN;
  if(!configured) return res.status(503).json({error:'MERLIN_AUTOMATION_TOKEN not configured'});
  const supplied=req.headers.authorization?.replace(/^Bearer\s+/i,'')||req.headers['x-merlin-token'];
  if(supplied!==configured) return res.status(401).json({error:'Unauthorized'});
  next();
}
function jsonField(row,key,fallback){try{return JSON.parse(row[key]||JSON.stringify(fallback));}catch{return fallback;}}
function enrichObservationSources(db,o){
  const ids=jsonField(o,'source_ids_json',[]);
  const sources=ids.map(sid=>db.prepare('SELECT id,url,title,publisher,observed_at FROM research_sources WHERE id=?').get(sid)).filter(Boolean);
  return {...o,direct_evidence:jsonField(o,'direct_evidence_json',[]),supporting_evidence:jsonField(o,'supporting_evidence_json',[]),unknowns:jsonField(o,'unknowns_json',[]),source_ids:ids,sources};
}
function orderRows(db, activeOnly=false) {
  const rows=db.prepare(`SELECT * FROM orders ${activeOnly?"WHERE status NOT IN ('dispatched','cancelled')":''} ORDER BY CASE WHEN due_at IS NULL THEN 1 ELSE 0 END,due_at ASC,ordered_at DESC`).all();
  const lineStmt=db.prepare(`SELECT ol.*,p.product_code,p.name product_name FROM order_lines ol LEFT JOIN products p ON p.id=ol.product_id WHERE ol.order_id=? ORDER BY ol.id`);
  const now=Date.now();
  return rows.map(o=>({...o,line_summary:lineStmt.all(o.id),is_overdue:Boolean(o.due_at&&!['dispatched','cancelled'].includes(o.status)&&new Date(o.due_at).getTime()<now)}));
}

export function registerRoutes(app,db){
  app.get('/api/health',(req,res)=>res.json({ok:true,system:'MERLIN',version:'2.0.0',domain:'cnc-business-os',now:new Date().toISOString(),ai_configured:Boolean(process.env.OPENAI_API_KEY)}));
  app.get('/api/state',(req,res)=>res.json(businessSnapshot(db)));

  app.get('/api/dashboard',(req,res)=>{
    const open=db.prepare("SELECT COUNT(*) n,COALESCE(SUM(gross_total),0) value FROM orders WHERE status NOT IN ('dispatched','cancelled')").get();
    const overdue=db.prepare("SELECT COUNT(*) n FROM orders WHERE status NOT IN ('dispatched','cancelled') AND due_at IS NOT NULL AND datetime(due_at)<datetime('now')").get().n;
    const dueToday=db.prepare("SELECT COUNT(*) n FROM orders WHERE status NOT IN ('dispatched','cancelled') AND due_at IS NOT NULL AND date(due_at)=date('now','localtime')").get().n;
    const revenue=db.prepare("SELECT COALESCE(SUM(gross_revenue-refunds),0) v FROM sales_events WHERE date(sold_at)>=date('now','start of month')").get().v;
    const fees=db.prepare("SELECT COALESCE(SUM(fees+shipping_cost),0) v FROM sales_events WHERE date(sold_at)>=date('now','start of month')").get().v;
    const expenses=db.prepare("SELECT COALESCE(SUM(amount),0) v FROM expenses WHERE date(occurred_at)>=date('now','start of month')").get().v;
    const products=db.prepare('SELECT COUNT(*) n FROM products').get().n;
    const lowStock=inventoryAlerts(db);
    const stockKinds=db.prepare(`SELECT kind,COUNT(*) item_count,COALESCE(SUM(quantity_on_hand),0) quantity_on_hand,COALESCE(SUM(quantity_reserved),0) reserved FROM inventory_items WHERE active=1 GROUP BY kind`).all();
    const observations=db.prepare('SELECT * FROM market_observations WHERE applicable_now=1 ORDER BY created_at DESC LIMIT 6').all().map(o=>enrichObservationSources(db,o));
    res.json({
      open_order_count:Number(open.n||0),open_order_value:Number(open.value||0),overdue_order_count:Number(overdue||0),due_today_count:Number(dueToday||0),
      revenue_mtd:Number(revenue||0),sales_costs_mtd:Number(fees||0),expenses_mtd:Number(expenses||0),products:Number(products||0),low_stock_count:lowStock.length,stockKinds,observations
    });
  });

  app.get('/api/activity',(req,res)=>{
    const limit=Math.min(100,Math.max(1,Number(req.query.limit||30)));
    const events=[];
    for(const r of db.prepare(`SELECT id,external_order_id,status,gross_total,currency,ordered_at created_at FROM orders ORDER BY ordered_at DESC LIMIT ?`).all(limit))
      events.push({type:'order',id:r.id,created_at:r.created_at,title:`Order ${r.external_order_id||r.id} recorded`,detail:`${r.status}${r.gross_total==null?'':` · ${r.currency} ${Number(r.gross_total).toFixed(2)}`}`});
    for(const r of db.prepare(`SELECT m.id,m.movement_type,m.quantity,m.created_at,i.name,i.unit FROM inventory_movements m JOIN inventory_items i ON i.id=m.inventory_item_id ORDER BY m.created_at DESC LIMIT ?`).all(limit))
      events.push({type:'inventory',id:r.id,created_at:r.created_at,title:`Inventory ${r.movement_type}: ${r.name}`,detail:`${r.quantity} ${r.unit}`});
    for(const r of db.prepare(`SELECT p.id,p.product_code,p.name,p.created_at FROM products p ORDER BY p.created_at DESC LIMIT ?`).all(limit))
      events.push({type:'product',id:r.id,created_at:r.created_at,title:`Product added: ${r.product_code}`,detail:r.name});
    for(const r of db.prepare(`SELECT pr.id,pr.product_id,pr.quantity,pr.success,pr.created_at,p.product_code FROM production_runs pr JOIN products p ON p.id=pr.product_id ORDER BY pr.created_at DESC LIMIT ?`).all(limit))
      events.push({type:'production',id:r.id,created_at:r.created_at,title:`Production run: ${r.product_code}`,detail:`${r.quantity} unit${r.quantity===1?'':'s'} · ${r.success?'success':'failed'}`});
    for(const r of db.prepare(`SELECT s.id,s.gross_revenue,s.currency,s.sold_at created_at,p.product_code FROM sales_events s LEFT JOIN products p ON p.id=s.product_id ORDER BY s.sold_at DESC LIMIT ?`).all(limit))
      events.push({type:'sale',id:r.id,created_at:r.created_at,title:`Sale recorded${r.product_code?`: ${r.product_code}`:''}`,detail:r.gross_revenue==null?'Revenue not recorded':`${r.currency} ${Number(r.gross_revenue).toFixed(2)}`});
    events.sort((a,b)=>new Date(b.created_at)-new Date(a.created_at));
    res.json(events.slice(0,limit));
  });

  app.get('/api/products',(req,res)=>res.json(listProducts(db)));
  app.get('/api/products/:id',(req,res)=>{const p=getProduct(db,req.params.id);if(!p)return res.status(404).json({error:'Product not found'});res.json(p);});
  app.patch('/api/products/:id',(req,res)=>{const p=updateProduct(db,req.params.id,req.body);if(!p)return res.status(404).json({error:'Product not found'});res.json(p);});
  app.get('/api/products/:id/performance',(req,res)=>{if(!db.prepare('SELECT id FROM products WHERE id=?').get(req.params.id))return res.status(404).json({error:'Product not found'});res.json(productPerformance(db,req.params.id));});
  app.get('/api/products/:id/bom',(req,res)=>res.json(db.prepare(`SELECT b.*,i.name inventory_name,i.unit inventory_unit,i.unit_cost inventory_unit_cost FROM product_bom b JOIN inventory_items i ON i.id=b.inventory_item_id WHERE b.product_id=? ORDER BY i.name`).all(req.params.id)));
  app.post('/api/products/:id/bom',(req,res)=>{
    const bomId=id('BOM');
    db.prepare(`INSERT INTO product_bom (id,product_id,inventory_item_id,quantity_per_unit,notes) VALUES (?,?,?,?,?) ON CONFLICT(product_id,inventory_item_id) DO UPDATE SET quantity_per_unit=excluded.quantity_per_unit,notes=excluded.notes`).run(bomId,req.params.id,req.body.inventory_item_id,Number(req.body.quantity_per_unit),req.body.notes||null);
    syncProductSnapshot(db,req.params.id);res.status(201).json(db.prepare('SELECT * FROM product_bom WHERE product_id=? AND inventory_item_id=?').get(req.params.id,req.body.inventory_item_id));
  });
  app.post('/api/products/upload-dxf',upload.single('file'),(req,res)=>{
    if(!req.file)return res.status(400).json({error:'DXF file required'});
    if(path.extname(req.file.originalname).toLowerCase()!=='.dxf')return res.status(400).json({error:'Only .dxf files are accepted'});
    res.status(201).json(ingestDxf(db,{buffer:req.file.buffer,originalname:req.file.originalname,name:req.body.name,category:req.body.category,subcategory:req.body.subcategory,language:req.body.language,legalStatus:req.body.legal_status,unitOverride:req.body.unit_override||null,primaryMaterialId:req.body.primary_material_inventory_item_id||null}));
  });
  app.post('/api/revisions/:id/units',(req,res)=>{
    if(!['millimeters','inches','centimeters','meters'].includes(req.body.unit))return res.status(400).json({error:'unit must be millimeters, inches, centimeters, or meters'});
    const r=reconfirmRevisionUnits(db,req.params.id,req.body.unit);if(!r)return res.status(404).json({error:'Revision not found'});res.json(r);
  });
  app.get('/api/products/:id/preview',(req,res)=>{
    const p=db.prepare('SELECT active_revision_id FROM products WHERE id=?').get(req.params.id);if(!p)return res.status(404).end();
    const r=db.prepare('SELECT preview_path FROM product_revisions WHERE id=?').get(p.active_revision_id);if(!r?.preview_path||!fs.existsSync(r.preview_path))return res.status(404).end();
    res.type('image/svg+xml').sendFile(path.resolve(r.preview_path));
  });
  app.post('/api/revisions/:id/validate',(req,res)=>{
    if(req.body.validation_status!=='validated')return res.status(400).json({error:'Only explicit owner validation to validated is supported'});
    const rev=db.prepare('SELECT * FROM product_revisions WHERE id=?').get(req.params.id);if(!rev)return res.status(404).json({error:'Revision not found'});
    const validation=jsonField(rev,'validation_json',{});validation.manual_validation={by:'owner',at:new Date().toISOString(),notes:req.body.notes||null};
    db.prepare("UPDATE product_revisions SET validation_status='validated',validation_json=? WHERE id=?").run(JSON.stringify(validation),rev.id);syncProductSnapshot(db,rev.product_id);res.json(db.prepare('SELECT * FROM product_revisions WHERE id=?').get(rev.id));
  });

  app.get('/api/orders',(req,res)=>res.json(orderRows(db,req.query.active==='1')));
  app.post('/api/orders',(req,res)=>{
    const status=req.body.status||'new';if(!ORDER_STATUSES.includes(status))return res.status(400).json({error:'Invalid order status'});
    const orderId=id('ORD');const tx=db.transaction(()=>{
      db.prepare(`INSERT INTO orders (id,external_order_id,channel,status,customer_reference,gross_total,currency,ordered_at,due_at,dispatched_at,notes) VALUES (?,?,?,?,?,?,?,COALESCE(?,CURRENT_TIMESTAMP),?,?,?)`).run(orderId,req.body.external_order_id||null,req.body.channel||null,status,req.body.customer_reference||null,req.body.gross_total==null?null:Number(req.body.gross_total),req.body.currency||'GBP',req.body.ordered_at||null,req.body.due_at||null,status==='dispatched'?(req.body.dispatched_at||new Date().toISOString()):(req.body.dispatched_at||null),req.body.notes||null);
      for(const line of(req.body.lines||[]))db.prepare(`INSERT INTO order_lines (id,order_id,product_id,description,quantity,unit_price,customisation_json) VALUES (?,?,?,?,?,?,?)`).run(id('LINE'),orderId,line.product_id||null,line.description||null,Number(line.quantity||1),line.unit_price==null?null:Number(line.unit_price),JSON.stringify(line.customisation||{}));
    });tx();res.status(201).json(orderRows(db,false).find(o=>o.id===orderId));
  });
  app.patch('/api/orders/:id',(req,res)=>{
    const c=db.prepare('SELECT * FROM orders WHERE id=?').get(req.params.id);if(!c)return res.status(404).json({error:'Order not found'});const status=req.body.status??c.status;if(!ORDER_STATUSES.includes(status))return res.status(400).json({error:'Invalid order status'});
    db.prepare(`UPDATE orders SET external_order_id=?,channel=?,status=?,customer_reference=?,gross_total=?,currency=?,due_at=?,dispatched_at=?,notes=? WHERE id=?`).run(req.body.external_order_id??c.external_order_id,req.body.channel??c.channel,status,req.body.customer_reference??c.customer_reference,req.body.gross_total===undefined?c.gross_total:(req.body.gross_total==null?null:Number(req.body.gross_total)),req.body.currency??c.currency,req.body.due_at===undefined?c.due_at:req.body.due_at,status==='dispatched'?(req.body.dispatched_at||c.dispatched_at||new Date().toISOString()):(req.body.dispatched_at??c.dispatched_at),req.body.notes??c.notes,c.id);
    res.json(orderRows(db,false).find(o=>o.id===c.id));
  });
  app.post('/api/orders/:id/lines',(req,res)=>{
    if(!db.prepare('SELECT id FROM orders WHERE id=?').get(req.params.id))return res.status(404).json({error:'Order not found'});const lineId=id('LINE');db.prepare(`INSERT INTO order_lines (id,order_id,product_id,description,quantity,unit_price,customisation_json) VALUES (?,?,?,?,?,?,?)`).run(lineId,req.params.id,req.body.product_id||null,req.body.description||null,Number(req.body.quantity||1),req.body.unit_price==null?null:Number(req.body.unit_price),JSON.stringify(req.body.customisation||{}));res.status(201).json(db.prepare('SELECT * FROM order_lines WHERE id=?').get(lineId));
  });

  app.get('/api/inventory',(req,res)=>res.json(listInventory(db)));
  app.get('/api/inventory/alerts',(req,res)=>res.json(inventoryAlerts(db)));
  app.post('/api/inventory',(req,res)=>res.status(201).json(createInventoryItem(db,req.body)));
  app.patch('/api/inventory/:id',(req,res)=>{const item=updateInventoryItem(db,req.params.id,req.body);if(!item)return res.status(404).json({error:'Inventory item not found'});res.json(item);});
  app.post('/api/inventory/movements',(req,res)=>res.status(201).json(moveInventory(db,req.body)));
  app.get('/api/inventory/:id',(req,res)=>{const item=getInventoryItem(db,req.params.id);if(!item)return res.status(404).json({error:'Inventory item not found'});res.json(item);});

  app.post('/api/expenses',(req,res)=>{if(req.body.amount==null||!req.body.description||!req.body.category)return res.status(400).json({error:'category, description and amount required'});const eid=id('EXP');db.prepare(`INSERT INTO expenses (id,category,description,amount,currency,occurred_at,supplier_id,reference_type,reference_id,notes) VALUES (?,?,?,?,?,COALESCE(?,CURRENT_TIMESTAMP),?,?,?,?)`).run(eid,req.body.category,req.body.description,Number(req.body.amount),req.body.currency||'GBP',req.body.occurred_at||null,req.body.supplier_id||null,req.body.reference_type||null,req.body.reference_id||null,req.body.notes||null);res.status(201).json(db.prepare('SELECT * FROM expenses WHERE id=?').get(eid));});
  app.get('/api/expenses',(req,res)=>res.json(db.prepare('SELECT * FROM expenses ORDER BY occurred_at DESC LIMIT 200').all()));

  app.get('/api/memory',(req,res)=>res.json(db.prepare('SELECT * FROM memory_facts WHERE active=1 ORDER BY category,fact_key').all()));
  app.post('/api/memory',(req,res)=>res.status(201).json(upsertFact(db,{...req.body,source:'user',confidence:'direct'})));
  app.get('/api/capabilities',(req,res)=>res.json(db.prepare('SELECT * FROM capabilities ORDER BY status,name').all()));
  app.get('/api/upgrades',(req,res)=>res.json(db.prepare('SELECT * FROM system_upgrade_requests ORDER BY created_at DESC').all()));
  app.post('/api/sales',(req,res)=>{const sale=recordSale(db,req.body);if(req.body.product_id)syncProductSnapshot(db,req.body.product_id);res.status(201).json(sale);});
  app.post('/api/production-runs',(req,res)=>{const run=recordProductionRun(db,req.body);syncProductSnapshot(db,req.body.product_id);res.status(201).json(run);});

  app.get('/api/market/observations',(req,res)=>res.json(db.prepare('SELECT * FROM market_observations ORDER BY created_at DESC LIMIT 100').all().map(o=>enrichObservationSources(db,o))));
  app.get('/api/market/sources',(req,res)=>res.json(db.prepare('SELECT * FROM research_sources ORDER BY observed_at DESC LIMIT 300').all()));
  app.post('/api/market/research',requireAutomationToken,asyncRoute(async(req,res)=>res.json(await runMarketResearch(db,req.body.focus||'current best opportunities for this CNC plasma business'))));
  app.post('/api/ai/chat',asyncRoute(async(req,res)=>{if(!req.body.message?.trim())return res.status(400).json({error:'message required'});res.json(await chatWithMerlin(db,req.body.message.trim()));}));
  app.post('/api/design/from-image',upload.single('file'),(req,res)=>res.status(501).json({error:'Not enabled in MERLIN V2',reason:'MERLIN does not claim arbitrary image-to-production-DXF reliability. Enable only after a validated vision + vector + topology + CNC-check pipeline demonstrably meets your cut-ready standard.'}));
}
