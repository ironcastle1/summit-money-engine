import test from 'node:test';
import assert from 'node:assert/strict';
import Database from 'better-sqlite3';
import { migrateDatabase } from '../src/db/database.js';
import { createInventoryItem, moveInventory } from '../src/inventory/inventory-service.js';

test('inventory movements update on-hand quantity and prevent negative stock', () => {
  const db = new Database(':memory:');
  db.pragma('foreign_keys = ON');
  migrateDatabase(db);
  const item = createInventoryItem(db, { kind:'raw_material', name:'Test steel', unit:'sheet', quantity_on_hand:5, unit_cost:20, currency:'GBP' });
  const r = moveInventory(db, { inventory_item_id:item.id, movement_type:'consume', quantity:2 });
  assert.equal(r.item.quantity_on_hand, 3);
  assert.throws(() => moveInventory(db, { inventory_item_id:item.id, movement_type:'consume', quantity:4 }), /negative/);
});

test('reservations reduce available quantity without changing physical on-hand quantity', () => {
  const db = new Database(':memory:');
  db.pragma('foreign_keys = ON');
  migrateDatabase(db);
  const item = createInventoryItem(db, { kind:'finished_product', name:'Test product', unit:'each', quantity_on_hand:5, unit_cost:10, currency:'GBP' });
  const r = moveInventory(db, { inventory_item_id:item.id, movement_type:'reserve', quantity:2 });
  assert.equal(r.item.quantity_on_hand, 5);
  assert.equal(r.item.quantity_reserved, 2);
  assert.equal(r.item.available_quantity, 3);
});
