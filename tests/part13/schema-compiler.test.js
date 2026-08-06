import test from 'node:test';
import assert from 'node:assert/strict';
import { compileWorkflow, dependencyCycles, workflowRecord } from '../../src/automation-workflows/index.js';
import { workflowFixture } from './fixtures.js';
test('workflow schema compiles ordered actions', () => { const workflow = compileWorkflow(workflowFixture()); assert.equal(workflow.state, 'ACTIVE'); assert.deepEqual(workflow.executionOrder, ['notify', 'task']); assert.ok(workflow.checksum.startsWith('wf-')); });
test('workflow schema rejects unsupported action', () => assert.throws(() => workflowRecord(workflowFixture({ actions: [{ type: 'UNKNOWN' }] })), /Unsupported action/));
test('dependency cycle detector reports cycle', () => { const actions = [{ id: 'a', dependsOn: ['b'] }, { id: 'b', dependsOn: ['a'] }]; assert.equal(dependencyCycles(actions).length, 1); });
