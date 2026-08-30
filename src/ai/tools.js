import { upsertFact } from '../services/memory.js';
import { createInventoryItem, moveInventory } from '../inventory/inventory-service.js';
import { recordProductionRun } from '../services/production.js';
import { requestUpgrade } from '../services/upgrades.js';
import { id } from '../util/id.js';
import { recordSale } from '../services/sales.js';
import { syncProductSnapshot } from '../products/product-service.js';

export const toolDefinitions = [
  {
    type: 'function', name: 'record_memory_fact',
    description: 'Store an exact durable business fact explicitly supplied by the owner. Never use this for guesses.',
    parameters: {
      type: 'object', additionalProperties: false,
      properties: {
        category: { type: 'string' }, fact_key: { type: 'string' }, fact_value: { type: 'string' }
      }, required: ['category','fact_key','fact_value']
    }
  },
  {
    type: 'function', name: 'create_inventory_item',
    description: 'Create a tracked inventory item when the owner provides enough identifying information.',
    parameters: {
      type: 'object', additionalProperties: false,
      properties: {
        kind: { type: 'string', enum: ['raw_material','consumable','packaging','finished_product','offcut','hardware','other'] },
        name: { type: 'string' }, unit: { type: 'string' }, quantity_on_hand: { type: ['number','null'] },
        unit_cost: { type: ['number','null'] }, currency: { type: ['string','null'] }, location: { type: ['string','null'] },
        sku: { type: ['string','null'] }
      }, required: ['kind','name','unit','quantity_on_hand','unit_cost','currency','location','sku']
    }
  },
  {
    type: 'function', name: 'record_inventory_movement',
    description: 'Record a purchase, consumption, adjustment, reservation, production, scrap or return for an existing inventory item.',
    parameters: {
      type: 'object', additionalProperties: false,
      properties: {
        inventory_item_id: { type: 'string' },
        movement_type: { type: 'string', enum: ['purchase','consume','adjust','reserve','release','produce','scrap','return'] },
        quantity: { type: 'number' }, unit_cost: { type: ['number','null'] }, notes: { type: ['string','null'] }
      }, required: ['inventory_item_id','movement_type','quantity','unit_cost','notes']
    }
  },
  {
    type: 'function', name: 'record_production_run',
    description: 'Record observed production timing/results for a product. Only record values supplied or measured by the owner.',
    parameters: {
      type: 'object', additionalProperties: false,
      properties: {
        product_id: { type: 'string' }, revision_id: { type: ['string','null'] }, machine_id: { type: ['string','null'] },
        quantity: { type: ['number','null'] }, cut_seconds: { type: ['number','null'] }, cleanup_seconds: { type: ['number','null'] },
        finishing_seconds: { type: ['number','null'] }, packaging_seconds: { type: ['number','null'] }, success: { type: ['boolean','null'] },
        failure_reason: { type: ['string','null'] }, notes: { type: ['string','null'] }
      },
      required: ['product_id','revision_id','machine_id','quantity','cut_seconds','cleanup_seconds','finishing_seconds','packaging_seconds','success','failure_reason','notes']
    }
  },
  {
    type: 'function', name: 'set_product_cost',
    description: 'Store a dated product cost/price record from known inputs. Leave unknown fields null.',
    parameters: {
      type: 'object', additionalProperties: false,
      properties: {
        product_id: { type: 'string' }, material_cost: { type: ['number','null'] }, consumables_cost: { type: ['number','null'] },
        paint_cost: { type: ['number','null'] }, packaging_cost: { type: ['number','null'] }, marketplace_fees: { type: ['number','null'] },
        labour_cost: { type: ['number','null'] }, other_variable_cost: { type: ['number','null'] }, selling_price: { type: ['number','null'] },
        currency: { type: ['string','null'] }, notes: { type: ['string','null'] }
      }, required: ['product_id','material_cost','consumables_cost','paint_cost','packaging_cost','marketplace_fees','labour_cost','other_variable_cost','selling_price','currency','notes']
    }
  },
  {
    type: 'function', name: 'record_sale',
    description: 'Record an actual sale event from owner-supplied or connected sales data. Never invent missing monetary fields.',
    parameters: {
      type: 'object', additionalProperties: false,
      properties: {
        product_id: { type: ['string','null'] }, channel: { type: ['string','null'] }, quantity: { type: ['number','null'] },
        gross_revenue: { type: ['number','null'] }, fees: { type: ['number','null'] }, shipping_income: { type: ['number','null'] },
        shipping_cost: { type: ['number','null'] }, refunds: { type: ['number','null'] }, currency: { type: ['string','null'] },
        sold_at: { type: ['string','null'] }, notes: { type: ['string','null'] }
      }, required: ['product_id','channel','quantity','gross_revenue','fees','shipping_income','shipping_cost','refunds','currency','sold_at','notes']
    }
  },
  {
    type: 'function', name: 'record_capability_upgrade',
    description: 'Record a real physical/business capability upgrade explicitly reported by the owner and request any necessary MERLIN software evolution.',
    parameters: {
      type: 'object', additionalProperties: false,
      properties: {
        capability_name: { type: 'string' }, details: { type: 'object' }, reason: { type: 'string' }, requested_software_changes: { type: 'array', items: { type: 'string' } }
      }, required: ['capability_name','details','reason','requested_software_changes']
    }
  }
];

export function executeTool(db, name, args) {
  if (name === 'record_memory_fact') return upsertFact(db, { ...args, source: 'user', confidence: 'direct' });
  if (name === 'create_inventory_item') return createInventoryItem(db, args);
  if (name === 'record_inventory_movement') return moveInventory(db, args);
  if (name === 'record_production_run') { const r=recordProductionRun(db,args); syncProductSnapshot(db,args.product_id); return r; }
  if (name === 'set_product_cost') {
    const cid = id('COST');
    db.prepare(`INSERT INTO product_costs (
      id,product_id,material_cost,consumables_cost,paint_cost,packaging_cost,marketplace_fees,labour_cost,other_variable_cost,selling_price,currency,notes
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`).run(
      cid,args.product_id,args.material_cost,args.consumables_cost,args.paint_cost,args.packaging_cost,args.marketplace_fees,args.labour_cost,args.other_variable_cost,args.selling_price,args.currency||'GBP',args.notes
    );
    const result=db.prepare('SELECT * FROM product_costs WHERE id=?').get(cid); syncProductSnapshot(db,args.product_id); return result;
  }
  if (name === 'record_sale') { const r=recordSale(db,args); if(args.product_id) syncProductSnapshot(db,args.product_id); return r; }
  if (name === 'record_capability_upgrade') {
    const capId = id('CAP');
    db.prepare('INSERT INTO capabilities (id,name,status,details_json) VALUES (?,?,\'active\',?)').run(capId,args.capability_name,JSON.stringify(args.details||{}));
    return {
      capability: db.prepare('SELECT * FROM capabilities WHERE id=?').get(capId),
      software_upgrade_request: requestUpgrade(db, {
        trigger: `Physical/business capability added: ${args.capability_name}`,
        reason: args.reason,
        requested_changes: args.requested_software_changes
      })
    };
  }
  throw new Error(`Unknown tool: ${name}`);
}
