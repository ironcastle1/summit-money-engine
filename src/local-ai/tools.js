import { upsertFact } from '../services/memory.js';
import { createInventoryItem, moveInventory, listInventory } from '../inventory/inventory-service.js';
import { recordProductionRun } from '../services/production.js';
import { requestUpgrade } from '../services/upgrades.js';
import { id } from '../util/id.js';
import { recordSale } from '../services/sales.js';
import { syncProductSnapshot, getProduct, listProducts } from '../products/product-service.js';
import { runMarketResearch } from '../market/research.js';
import { searchKnowledge } from './context.js';

const nullableString = { type: ['string', 'null'] };
const nullableNumber = { type: ['number', 'null'] };
const fn = (name, description, properties = {}, required = []) => ({
  type: 'function',
  function: { name, description, parameters: { type: 'object', additionalProperties: false, properties, required } }
});

export const toolDefinitions = [
  fn('read_open_orders', 'Read all current open customer orders with line items.'),
  fn('read_inventory', 'Read current physical inventory. Optionally filter by kind.', { kind: nullableString }, []),
  fn('read_products', 'Read the current product registry. Optionally filter by category or status.', { category: nullableString, status: nullableString }, []),
  fn('read_product', 'Read one complete product record by immutable id or MER product code.', { product_ref: { type: 'string' } }, ['product_ref']),
  fn('read_recent_activity', 'Read recent operational events.', { limit: { type: 'number' } }, []),
  fn('read_market_evidence', 'Read sourced market observations already stored by MERLIN.', { limit: { type: 'number' } }, []),
  fn('read_raw_market_evidence', 'Read recently collected public market source items before interpretation.', { limit: { type: 'number' } }, []),
  fn('search_business_memory', 'Search MERLIN durable business knowledge and prior records for relevant facts.', { query: { type: 'string' }, limit: { type: 'number' } }, ['query']),
  fn('run_market_scan', 'Run a current public-web market scan now. Use only when the owner asks for current market research or opportunities.', { focus: nullableString }, []),

  fn('record_memory_fact', 'Store an exact durable business fact explicitly supplied by the owner. Never store guesses.', { category: { type: 'string' }, fact_key: { type: 'string' }, fact_value: { type: 'string' } }, ['category','fact_key','fact_value']),
  fn('create_inventory_item', 'Create a tracked physical inventory item from owner-supplied facts. Unknown values should be null.', {
    kind: { type: 'string', enum: ['raw_material','consumable','packaging','finished_product','offcut','hardware','other'] },
    name: { type: 'string' }, unit: { type: 'string' }, quantity_on_hand: { type: 'number' }, reorder_point: nullableNumber, unit_cost: nullableNumber,
    currency: nullableString, location: nullableString, sku: nullableString, material_family: nullableString, material_grade: nullableString,
    form: nullableString, thickness_mm: nullableNumber, width_mm: nullableNumber, height_mm: nullableNumber, length_mm: nullableNumber, colour: nullableString
  }, ['kind','name','unit','quantity_on_hand']),
  fn('record_inventory_movement', 'Record a physical inventory movement for an existing inventory item.', {
    inventory_item_id: { type: 'string' }, movement_type: { type: 'string', enum: ['purchase','consume','adjust','reserve','release','produce','scrap','return'] }, quantity: { type: 'number' }, unit_cost: nullableNumber, notes: nullableString
  }, ['inventory_item_id','movement_type','quantity']),
  fn('record_order', 'Record a real customer order explicitly supplied by the owner. Never invent missing customer, price, date or product.', {
    external_order_id: nullableString, channel: nullableString, customer_reference: nullableString,
    status: { type: 'string', enum: ['new','confirmed','queued','cutting','deburring','surface_prep','painting','curing','qc','packing','ready'] },
    gross_total: nullableNumber, currency: nullableString, due_at: nullableString, description: nullableString, product_id: nullableString,
    quantity: { type: 'number' }, unit_price: nullableNumber, notes: nullableString
  }, ['status','quantity']),
  fn('update_order_status', 'Update a real order manufacturing/fulfilment stage.', { order_id: { type: 'string' }, status: { type: 'string', enum: ['new','confirmed','queued','cutting','deburring','surface_prep','painting','curing','qc','packing','ready','dispatched','cancelled'] } }, ['order_id','status']),
  fn('record_production_run', 'Record measured production timing/results. Do not invent timings.', {
    product_id: { type: 'string' }, revision_id: nullableString, machine_id: nullableString, quantity: nullableNumber,
    material_inventory_item_id: nullableString, material_quantity_consumed: nullableNumber, cut_seconds: nullableNumber, cleanup_seconds: nullableNumber,
    finishing_seconds: nullableNumber, packaging_seconds: nullableNumber, success: { type: ['boolean','null'] }, failure_reason: nullableString, notes: nullableString
  }, ['product_id']),
  fn('set_product_cost', 'Store a dated product cost/price record from known inputs only.', {
    product_id: { type: 'string' }, material_cost: nullableNumber, consumables_cost: nullableNumber, paint_cost: nullableNumber,
    packaging_cost: nullableNumber, marketplace_fees: nullableNumber, labour_cost: nullableNumber, other_variable_cost: nullableNumber,
    selling_price: nullableNumber, currency: nullableString, notes: nullableString
  }, ['product_id']),
  fn('record_sale', 'Record an actual sale event from owner-supplied data.', {
    product_id: nullableString, channel: nullableString, quantity: nullableNumber, gross_revenue: nullableNumber, fees: nullableNumber,
    shipping_income: nullableNumber, shipping_cost: nullableNumber, refunds: nullableNumber, currency: nullableString, sold_at: nullableString, notes: nullableString
  }),
  fn('record_expense', 'Record a real business expense explicitly reported by the owner.', { category: { type: 'string' }, description: { type: 'string' }, amount: { type: 'number' }, currency: nullableString, occurred_at: nullableString, notes: nullableString }, ['category','description','amount']),
  fn('record_capability_upgrade', 'Record a real physical/business capability upgrade and propose only software changes made relevant by it.', {
    capability_name: { type: 'string' }, details: { type: 'object', additionalProperties: true }, reason: { type: 'string' }, requested_software_changes: { type: 'array', items: { type: 'string' } }
  }, ['capability_name','reason'])
];

function orderRows(db) {
  const orders = db.prepare("SELECT * FROM orders WHERE status NOT IN ('dispatched','cancelled') ORDER BY due_at IS NULL,due_at,ordered_at DESC").all();
  const lines = db.prepare(`SELECT ol.*,p.product_code,p.name product_name FROM order_lines ol LEFT JOIN products p ON p.id=ol.product_id WHERE ol.order_id=? ORDER BY ol.id`);
  return orders.map(o => ({ ...o, lines: lines.all(o.id) }));
}

function recentActivity(db, limit = 30) {
  const n = Math.min(100, Math.max(1, Number(limit || 30)));
  return db.prepare('SELECT event_type type,title,detail,reference_type,reference_id,created_at FROM business_events ORDER BY created_at DESC LIMIT ?').all(n);
}

function addBusinessEvent(db, type, title, detail = null, referenceType = null, referenceId = null) {
  db.prepare('INSERT INTO business_events (id,event_type,title,detail,reference_type,reference_id) VALUES (?,?,?,?,?,?)').run(id('EVT'), type, title, detail, referenceType, referenceId);
}

export async function executeTool(db, name, args = {}) {
  if (name === 'read_open_orders') return orderRows(db);
  if (name === 'read_inventory') { const rows = listInventory(db); return args.kind ? rows.filter(r => r.kind === args.kind) : rows; }
  if (name === 'read_products') { let rows = listProducts(db); if (args.category) rows = rows.filter(r => r.category === args.category); if (args.status) rows = rows.filter(r => r.status === args.status); return rows; }
  if (name === 'read_product') { const byId = db.prepare('SELECT id FROM products WHERE id=? OR product_code=?').get(args.product_ref,args.product_ref); return byId ? getProduct(db, byId.id) : { error: 'Product not found' }; }
  if (name === 'read_recent_activity') return recentActivity(db, args.limit);
  if (name === 'read_market_evidence') return db.prepare('SELECT id,topic,observation,why_valuable,direct_evidence_json,supporting_evidence_json,unknowns_json,suggested_test,created_at FROM market_observations WHERE applicable_now=1 ORDER BY created_at DESC LIMIT ?').all(Math.min(100, Math.max(1, Number(args.limit || 20))));
  if (name === 'read_raw_market_evidence') return db.prepare('SELECT id,query,title,url,publisher,observed_price,currency,snippet,published_at,evidence_type,collected_at FROM collected_market_items ORDER BY collected_at DESC LIMIT ?').all(Math.min(200, Math.max(1, Number(args.limit || 50))));
  if (name === 'search_business_memory') return searchKnowledge(db, args.query, args.limit || 20);
  if (name === 'run_market_scan') return runMarketResearch(db, args.focus || 'current opportunities relevant to the present CNC plasma business');

  if (name === 'record_memory_fact') { const r = upsertFact(db, { ...args, source: 'user', confidence: 'direct' }); addBusinessEvent(db,'memory','Business fact recorded',`${args.category}.${args.fact_key}: ${args.fact_value}`,'memory_fact',r?.id || null); return r; }
  if (name === 'create_inventory_item') { const payload = { ...args }; for (const k of ['reorder_point','unit_cost','location','sku','material_family','material_grade','form','thickness_mm','width_mm','height_mm','length_mm','colour']) if (!(k in payload)) payload[k] = null; payload.currency ||= 'GBP'; const r = createInventoryItem(db, payload); addBusinessEvent(db,'inventory',`Inventory item created: ${r.name}`,`${r.quantity_on_hand} ${r.unit}`,'inventory_item',r.id); return r; }
  if (name === 'record_inventory_movement') { const r = moveInventory(db,args); addBusinessEvent(db,'inventory',`Inventory ${args.movement_type}`,`${args.quantity} on ${args.inventory_item_id}`,'inventory_item',args.inventory_item_id); return r; }
  if (name === 'record_order') {
    const oid = id('ORD'), lineId = id('LINE');
    const tx = db.transaction(() => {
      db.prepare(`INSERT INTO orders (id,external_order_id,channel,status,customer_reference,gross_total,currency,due_at,notes) VALUES (?,?,?,?,?,?,?,?,?)`).run(oid,args.external_order_id||null,args.channel||null,args.status||'new',args.customer_reference||null,args.gross_total??null,args.currency||'GBP',args.due_at||null,args.notes||null);
      db.prepare(`INSERT INTO order_lines (id,order_id,product_id,description,quantity,unit_price,customisation_json) VALUES (?,?,?,?,?,?,?)`).run(lineId,oid,args.product_id||null,args.description||null,Number(args.quantity||1),args.unit_price??null,'{}');
    }); tx(); addBusinessEvent(db,'order',`Order recorded: ${args.external_order_id || oid}`,args.description || null,'order',oid); return orderRows(db).find(o => o.id === oid);
  }
  if (name === 'update_order_status') { const r = db.prepare("UPDATE orders SET status=?,dispatched_at=CASE WHEN ?='dispatched' THEN COALESCE(dispatched_at,CURRENT_TIMESTAMP) ELSE dispatched_at END WHERE id=?").run(args.status,args.status,args.order_id); if (!r.changes) throw new Error('Order not found'); addBusinessEvent(db,'order',`Order moved to ${args.status}`,null,'order',args.order_id); return db.prepare('SELECT * FROM orders WHERE id=?').get(args.order_id); }
  if (name === 'record_production_run') { const r = recordProductionRun(db,args); syncProductSnapshot(db,args.product_id); addBusinessEvent(db,'production','Production run recorded',`Product ${args.product_id}`,'production_run',r.id); return r; }
  if (name === 'set_product_cost') { const cid = id('COST'); db.prepare(`INSERT INTO product_costs (id,product_id,material_cost,consumables_cost,paint_cost,packaging_cost,marketplace_fees,labour_cost,other_variable_cost,selling_price,currency,notes) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`).run(cid,args.product_id,args.material_cost??null,args.consumables_cost??null,args.paint_cost??null,args.packaging_cost??null,args.marketplace_fees??null,args.labour_cost??null,args.other_variable_cost??null,args.selling_price??null,args.currency||'GBP',args.notes||null); syncProductSnapshot(db,args.product_id); return db.prepare('SELECT * FROM product_costs WHERE id=?').get(cid); }
  if (name === 'record_sale') { const r = recordSale(db,args); if (args.product_id) syncProductSnapshot(db,args.product_id); addBusinessEvent(db,'sale','Sale recorded',args.gross_revenue == null ? null : `£${args.gross_revenue}`,'sale',r.id); return r; }
  if (name === 'record_expense') { const eid = id('EXP'); db.prepare(`INSERT INTO expenses (id,category,description,amount,currency,occurred_at,notes) VALUES (?,?,?,?,?,COALESCE(?,CURRENT_TIMESTAMP),?)`).run(eid,args.category,args.description,Number(args.amount),args.currency||'GBP',args.occurred_at||null,args.notes||null); addBusinessEvent(db,'expense',`Expense recorded: ${args.description}`,`£${Number(args.amount).toFixed(2)}`,'expense',eid); return db.prepare('SELECT * FROM expenses WHERE id=?').get(eid); }
  if (name === 'record_capability_upgrade') { const capId = id('CAP'); db.prepare("INSERT INTO capabilities (id,name,status,details_json) VALUES (?,?,'active',?)").run(capId,args.capability_name,JSON.stringify(args.details||{})); const req = requestUpgrade(db,{trigger:`Physical/business capability added: ${args.capability_name}`,reason:args.reason,requested_changes:args.requested_software_changes||[]}); addBusinessEvent(db,'capability',`Capability added: ${args.capability_name}`,args.reason,'capability',capId); return { capability: db.prepare('SELECT * FROM capabilities WHERE id=?').get(capId), software_upgrade_request: req }; }
  throw new Error(`Unknown MERLIN tool: ${name}`);
}
