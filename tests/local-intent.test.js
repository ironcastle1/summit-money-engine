import test from 'node:test';
import assert from 'node:assert/strict';
import { parseDeterministicCommand } from '../src/local-ai/intent-parser.js';

test('parses explicit steel inventory command without an AI call',()=>{
  const r=parseDeterministicCommand('add 5 sheets 2.0mm mild steel 500 x 500mm cost £24.95 each');
  assert.equal(r.kind,'inventory_material');
  assert.equal(r.data.quantity_on_hand,5);
  assert.equal(r.data.thickness_mm,2);
  assert.equal(r.data.width_mm,500);
  assert.equal(r.data.height_mm,500);
  assert.equal(r.data.unit_cost,24.95);
});

test('does not pretend an unrelated sentence is a structured command',()=>{
  assert.equal(parseDeterministicCommand('What should I work on tomorrow?'),null);
});

test('recognises common database questions without requiring local model inference',()=>{
  assert.equal(parseDeterministicCommand('what steel do I have?').kind,'inventory_query');
  assert.equal(parseDeterministicCommand('show my open orders').kind,'orders_query');
  assert.equal(parseDeterministicCommand('how much revenue this month?').kind,'finance_query');
});
