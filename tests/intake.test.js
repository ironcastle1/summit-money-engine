import test from 'node:test';
import assert from 'node:assert/strict';
import Database from 'better-sqlite3';
import { migrateDatabase } from '../src/db/database.js';
import { parseIntakeText } from '../src/intake/parser.js';
import { parseAndStoreIntake, commitIntake } from '../src/intake/service.js';

test('parses a steel sheet purchase without inventing fields',()=>{
  const r=parseIntakeText('Bought 5 sheets of 2.0mm cold reduced steel 500 x 500mm for £110 delivered');
  assert.equal(r.action,'inventory_material_purchase');
  assert.equal(r.can_commit,true);
  assert.equal(r.fields.quantity,5);
  assert.equal(r.fields.thickness_mm,2);
  assert.equal(r.fields.width_mm,500);
  assert.equal(r.fields.height_mm,500);
  assert.equal(r.fields.total_cost,110);
  assert.equal(r.fields.unit_cost,22);
});

test('does not mistake sheet dimensions for thickness',()=>{
  const r=parseIntakeText('Bought 1 steel sheet 500 x 500mm for £25');
  assert.equal(r.fields.thickness_mm,null);
  assert.equal(r.can_commit,false);
  assert.ok(r.missing_fields.includes('thickness_mm'));
});

test('unknown statement is not silently written',()=>{
  const r=parseIntakeText('Maybe I should make something cool next week');
  assert.equal(r.action,'unsupported');
  assert.equal(r.can_commit,false);
});

test('production command recognises quantity and measured times',()=>{
  const r=parseIntakeText('Cut 2 of MER-WALLART-000001; cutting 14 min, cleanup 8 min');
  assert.equal(r.action,'production_run');
  assert.equal(r.fields.quantity,2);
  assert.equal(r.fields.cut_seconds,840);
  assert.equal(r.fields.cleanup_seconds,480);
});

test('ready intake commits raw material to inventory',()=>{
  const db=new Database(':memory:');db.pragma('foreign_keys = ON');migrateDatabase(db);
  const d=parseAndStoreIntake(db,'Bought 2 sheets of 2mm mild steel 500 x 500mm for £40');
  assert.equal(d.can_commit,true);
  const done=commitIntake(db,d.intake_id);
  assert.equal(done.status,'committed');
  const row=db.prepare("SELECT * FROM inventory_items WHERE kind='raw_material'").get();
  assert.equal(row.quantity_on_hand,2);
  assert.equal(row.unit_cost,20);
});
