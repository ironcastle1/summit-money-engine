import test from 'node:test';
import assert from 'node:assert/strict';
import { migrationPlan, migrationRun, schemaCompatibility, dataCompatibility, endpointInventory, contractDiff } from '../../src/release-engineering/index.js';
test('migration plan orders dependencies', () => { const plan = migrationPlan([{ id: 'm1', name: 'one', sequence: 1, reversible: true }, { id: 'm2', name: 'two', sequence: 2, reversible: true, dependencies: ['m1'] }], []); assert.equal(plan.valid, true); assert.deepEqual(plan.ordered.map(item => item.id), ['m1', 'm2']); });
test('migration run records dry run state', () => assert.equal(migrationRun({ dryRun: true, plan: { ordered: [{ id: 'm1' }] } }).steps[0].state, 'DRY_RUN_READY'));
test('schema removal is breaking', () => assert.equal(schemaCompatibility({ a: { required: true } }, {}).breaking, true));
test('data loss risk blocks compatibility', () => assert.equal(dataCompatibility({ lossPercent: 1, recordsChecked: 100 }).compatible, false));
test('endpoint duplicates are rejected', () => assert.equal(endpointInventory([{ method: 'GET', path: '/a' }, { method: 'GET', path: '/a' }]).valid, false));
test('removed API contract is breaking', () => assert.equal(contractDiff([{ method: 'GET', path: '/a' }], []).breaking, true));
