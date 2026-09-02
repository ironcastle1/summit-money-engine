import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import { ingestDxf, addDxfRevision, getProduct, listProducts, syncProductSnapshot, updateProduct, reconfirmRevisionUnits, reanalyseProducts } from '../products/product-service.js';
import { createInventoryItem, moveInventory, listInventory, inventoryAlerts, updateInventoryItem, getInventoryItem } from '../inventory/inventory-service.js';
import { businessSnapshot } from '../services/snapshot.js';
import { upsertFact } from '../services/memory.js';
import { runMarketResearch, rawMarketEvidence, opportunityWatch } from '../market/research.js';
import { marketResearchStatus } from '../market/scheduler.js';
import { id, sha256 } from '../util/id.js';
import { recordSale, productPerformance } from '../services/sales.js';
import { recordProductionRun } from '../services/production.js';
import { parseAndStoreIntake, commitIntake, listIntake } from '../intake/service.js';
import { storeProductAssets, listProductAssets } from '../products/asset-service.js';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });

function asyncRoute(fn) { return (req,res,next)=>Promise.resolve(fn(req,res,next)).catch(next); }
function requireAutomationToken(req,res,next) {
  if(process.env.MERLIN_REQUIRE_AUTOMATION_TOKEN!=='true') return next();
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

export function registerRoutes(app,db){
  app.get('/api/health',(req,res)=>res.json({ok:true,system:'MERLIN',version:'6.0.0',domain:'cnc-business-os-deterministic',now:new Date().toISOString(),intake:'deterministic-parser',research:marketResearchStatus(db)}));
  app.get('/api/state',(req,res)=>res.json(businessSnapshot(db)));

  app.get('/api/preferences/dashboard-layout',(req,res)=>{
    const row=db.prepare("SELECT value_json FROM ui_preferences WHERE preference_key='dashboard_layout'").get();
    if(!row)return res.json({order:[],spans:{}});
    try{return res.json(JSON.parse(row.value_json));}catch{return res.json({order:[],spans:{}});}
  });
  app.put('/api/preferences/dashboard-layout',(req,res)=>{
    const value={order:Array.isArray(req.body.order)?req.body.order:[],spans:req.body.spans&&typeof req.body.spans==='object'?req.body.spans:{}};
    db.prepare("INSERT INTO ui_preferences (preference_key,value_json) VALUES ('dashboard_layout',?) ON CONFLICT(preference_key) DO UPDATE SET value_json=excluded.value_json,updated_at=CURRENT_TIMESTAMP").run(JSON.stringify(value));
    res.json(value);
  });

  app.get('/api/dashboard',(req,res)=>{
    const revenue=db.prepare("SELECT COALESCE(SUM(gross_revenue-refunds),0) v FROM sales_events WHERE date(sold_at)>=date('now','start of month')").get().v;
    const fees=db.prepare("SELECT COALESCE(SUM(fees+shipping_cost),0) v FROM sales_events WHERE date(sold_at)>=date('now','start of month')").get().v;
    const expenses=db.prepare("SELECT COALESCE(SUM(amount),0) v FROM expenses WHERE date(occurred_at)>=date('now','start of month')").get().v;
    const sales=db.prepare("SELECT COALESCE(SUM(quantity),0) units,COUNT(*) events FROM sales_events WHERE date(sold_at)>=date('now','start of month')").get();
    const products=db.prepare('SELECT COUNT(*) n FROM products').get().n;
    const lowStock=inventoryAlerts(db);
    const stockKinds=db.prepare(`SELECT kind,COUNT(*) item_count,COALESCE(SUM(quantity_on_hand),0) quantity_on_hand,COALESCE(SUM(quantity_reserved),0) reserved FROM inventory_items WHERE active=1 GROUP BY kind`).all();
    const observations=db.prepare('SELECT * FROM market_observations WHERE applicable_now=1 ORDER BY created_at DESC LIMIT 6').all().map(o=>enrichObservationSources(db,o));
    res.json({
      revenue_mtd:Number(revenue||0),sales_costs_mtd:Number(fees||0),expenses_mtd:Number(expenses||0),
      units_sold_mtd:Number(sales.units||0),sale_events_mtd:Number(sales.events||0),products:Number(products||0),
      low_stock_count:lowStock.length,stockKinds,observations
    });
  });

  app.get('/api/activity',(req,res)=>{
    const limit=Math.min(100,Math.max(1,Number(req.query.limit||30)));
    const events=[];
    for(const r of db.prepare(`SELECT m.id,m.movement_type,m.quantity,m.created_at,i.name,i.unit FROM inventory_movements m JOIN inventory_items i ON i.id=m.inventory_item_id ORDER BY m.created_at DESC LIMIT ?`).all(limit))
      events.push({type:'inventory',id:r.id,created_at:r.created_at,title:`Inventory ${r.movement_type}: ${r.name}`,detail:`${r.quantity} ${r.unit}`});
    for(const r of db.prepare(`SELECT p.id,p.product_code,p.name,p.created_at FROM products p ORDER BY p.created_at DESC LIMIT ?`).all(limit))
      events.push({type:'product',id:r.id,created_at:r.created_at,title:`Product added: ${r.product_code}`,detail:r.name});
    for(const r of db.prepare(`SELECT pr.id,pr.product_id,pr.quantity,pr.success,pr.created_at,p.product_code FROM production_runs pr JOIN products p ON p.id=pr.product_id ORDER BY pr.created_at DESC LIMIT ?`).all(limit))
      events.push({type:'production',id:r.id,created_at:r.created_at,title:`Production run: ${r.product_code}`,detail:`${r.quantity} unit${r.quantity===1?'':'s'} · ${r.success?'success':'failed'}`});
    for(const r of db.prepare(`SELECT s.id,s.gross_revenue,s.currency,s.sold_at created_at,p.product_code FROM sales_events s LEFT JOIN products p ON p.id=s.product_id ORDER BY s.sold_at DESC LIMIT ?`).all(limit))
      events.push({type:'sale',id:r.id,created_at:r.created_at,title:`Sale recorded${r.product_code?`: ${r.product_code}`:''}`,detail:r.gross_revenue==null?'Revenue not recorded':`${r.currency} ${Number(r.gross_revenue).toFixed(2)}`});
    for(const r of db.prepare(`SELECT id,event_type,created_at,title,detail FROM business_events ORDER BY created_at DESC LIMIT ?`).all(limit))
      events.push({type:r.event_type,id:r.id,created_at:r.created_at,title:r.title,detail:r.detail||''});
    events.sort((a,b)=>new Date(b.created_at)-new Date(a.created_at));
    res.json(events.slice(0,limit));
  });

  app.get('/api/products',(req,res)=>res.json(listProducts(db)));
  app.post('/api/products/analyse',(req,res)=>{const ids=Array.isArray(req.body?.product_ids)?req.body.product_ids:null;res.json(reanalyseProducts(db,ids));});
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
    const hash=sha256(req.file.buffer);const existing=db.prepare(`SELECT p.id,p.product_code,p.name FROM product_revisions r JOIN products p ON p.id=r.product_id WHERE r.sha256=? ORDER BY r.created_at LIMIT 1`).get(hash);
    if(existing)return res.status(409).json({error:`This exact DXF is already stored as ${existing.product_code} — ${existing.name}`,existing_product:existing});
    res.status(201).json(ingestDxf(db,{buffer:req.file.buffer,originalname:req.file.originalname,name:req.body.name,category:req.body.category,subcategory:req.body.subcategory,language:req.body.language,legalStatus:req.body.legal_status,unitOverride:req.body.unit_override||null,primaryMaterialId:req.body.primary_material_inventory_item_id||null}));
  });
  app.post('/api/products/upload-dxfs',upload.array('files',50),(req,res)=>{
    if(!req.files?.length)return res.status(400).json({error:'At least one DXF file is required'});
    const results=[];
    for(const file of req.files){
      if(path.extname(file.originalname).toLowerCase()!=='.dxf'){results.push({filename:file.originalname,status:'skipped',reason:'not a DXF'});continue;}
      const hash=sha256(file.buffer);const existing=db.prepare(`SELECT p.id,p.product_code,p.name FROM product_revisions r JOIN products p ON p.id=r.product_id WHERE r.sha256=? ORDER BY r.created_at LIMIT 1`).get(hash);
      if(existing){results.push({filename:file.originalname,status:'duplicate',existing_product:existing});continue;}
      try{const product=ingestDxf(db,{buffer:file.buffer,originalname:file.originalname,name:null,category:req.body.category,subcategory:req.body.subcategory,language:req.body.language,legalStatus:req.body.legal_status,unitOverride:req.body.unit_override||null,primaryMaterialId:req.body.primary_material_inventory_item_id||null});results.push({filename:file.originalname,status:'created',product_id:product.id,product_code:product.product_code,name:product.name});}
      catch(error){results.push({filename:file.originalname,status:'error',reason:error.message});}
    }
    res.status(207).json({results,created:results.filter(r=>r.status==='created').length,duplicates:results.filter(r=>r.status==='duplicate').length,errors:results.filter(r=>r.status==='error').length});
  });
  app.post('/api/products/:id/revisions',upload.single('file'),(req,res)=>{
    if(!req.file)return res.status(400).json({error:'DXF file required'});
    if(path.extname(req.file.originalname).toLowerCase()!=='.dxf')return res.status(400).json({error:'Only .dxf files are accepted as product revisions'});
    res.status(201).json(addDxfRevision(db,req.params.id,{buffer:req.file.buffer,originalname:req.file.originalname,unitOverride:req.body.unit_override||null}));
  });
  app.get('/api/products/:id/assets',(req,res)=>res.json(listProductAssets(db,req.params.id)));
  app.get('/api/product-assets/:id/file',(req,res)=>{const a=db.prepare('SELECT * FROM product_assets WHERE id=?').get(req.params.id);if(!a||!a.stored_path||!fs.existsSync(a.stored_path))return res.status(404).end();res.sendFile(path.resolve(a.stored_path));});
  app.post('/api/products/:id/assets',upload.array('files',20),(req,res)=>{
    if(!req.files?.length)return res.status(400).json({error:'At least one file is required'});
    res.status(201).json(storeProductAssets(db,req.params.id,req.files,req.body.kind||null));
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

  app.post('/api/intake/parse',(req,res)=>{
    if(!req.body.text?.trim())return res.status(400).json({error:'text required'});
    res.status(201).json(parseAndStoreIntake(db,req.body.text));
  });
  app.post('/api/intake/:id/commit',(req,res)=>res.json(commitIntake(db,req.params.id)));
  app.get('/api/intake',(req,res)=>res.json(listIntake(db,req.query.limit||50)));

  app.get('/api/market/observations',(req,res)=>res.json(db.prepare('SELECT * FROM market_observations ORDER BY created_at DESC LIMIT 100').all().map(o=>enrichObservationSources(db,o))));
  app.get('/api/market/status',(req,res)=>res.json(marketResearchStatus(db)));
  app.get('/api/market/opportunities',(req,res)=>res.json(opportunityWatch(db,req.query.limit||20)));
  app.get('/api/market/evidence',(req,res)=>res.json(rawMarketEvidence(db,req.query.limit||80)));
  app.get('/api/market/config',(req,res)=>res.json(db.prepare('SELECT * FROM market_source_config ORDER BY id').all()));
  app.patch('/api/market/config/:id',(req,res)=>{const c=db.prepare('SELECT * FROM market_source_config WHERE id=?').get(req.params.id);if(!c)return res.status(404).json({error:'Market source not found'});db.prepare('UPDATE market_source_config SET name=?,source_type=?,query=?,enabled=?,notes=?,updated_at=CURRENT_TIMESTAMP WHERE id=?').run(req.body.name??c.name,req.body.source_type??c.source_type,req.body.query??c.query,req.body.enabled===undefined?c.enabled:(req.body.enabled?1:0),req.body.notes??c.notes,c.id);res.json(db.prepare('SELECT * FROM market_source_config WHERE id=?').get(c.id));});
  app.get('/api/market/sources',(req,res)=>res.json(db.prepare('SELECT * FROM research_sources ORDER BY observed_at DESC LIMIT 300').all()));
  app.post('/api/market/research',requireAutomationToken,(req,res,next)=>{
    const running=db.prepare("SELECT id,started_at FROM market_scan_runs WHERE status='running' AND datetime(started_at)>datetime('now','-2 hours') ORDER BY started_at DESC LIMIT 1").get();
    if(running)return res.status(202).json({started:false,already_running:true,run_id:running.id});
    const focus=req.body.focus||null;
    res.status(202).json({started:true,message:'Market scan started in background.'});
    runMarketResearch(db,focus).catch(err=>console.error('Manual market scan failed:',err));
  });
  app.post('/api/design/from-image',upload.single('file'),(req,res)=>res.status(501).json({error:'Not enabled in MERLIN V6',reason:'MERLIN does not claim arbitrary image-to-production-DXF reliability. Enable only after a validated vision + vector + topology + CNC-check pipeline demonstrably meets your cut-ready standard.'}));
}
