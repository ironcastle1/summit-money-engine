import test from 'node:test';
import assert from 'node:assert/strict';
import { performanceBudget, testEvidence, qualityGate, acceptanceCriteria, deploymentChecklist, upgradePlan, rollbackPlan } from '../../src/release-engineering/index.js';
test('performance budget fails excessive metric', () => assert.equal(performanceBudget({ budgets: { startupMs: 1000 }, actual: { startupMs: 2000 } }).pass, false));
test('test evidence reflects failed tests', () => assert.equal(testEvidence({ suite: 'all', total: 2, passed: 1, failed: 1 }).state, 'FAIL'));
test('quality gate blocks not-run required checks', () => assert.equal(qualityGate({ checks: [{ name: 'tests', state: 'NOT_RUN' }] }).pass, false));
test('acceptance criteria calculate blockers', () => assert.equal(acceptanceCriteria([{ id: 'a', expected: true }], { a: false }).accepted, false));
test('deployment checklist requires operational handover', () => assert.equal(deploymentChecklist({ approved: true }).complete, false));
test('upgrade and rollback plans contain operational phases', () => { assert.ok(upgradePlan({}).phases.length >= 5); assert.equal(rollbackPlan({ previousArtifactId: 'a', backupId: 'b' }).ready, true); });
