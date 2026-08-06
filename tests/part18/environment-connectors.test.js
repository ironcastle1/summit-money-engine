import test from 'node:test';
import assert from 'node:assert/strict';
import { environmentContract, configurationMatrix, connectorReadiness, sourceReadiness } from '../../src/release-engineering/index.js';
test('environment contracts identify missing variables', () => { const env = environmentContract({ name: 'production', requiredVariables: ['SESSION_SECRET'], values: {} }); assert.equal(env.ready, false); assert.deepEqual(env.missing, ['SESSION_SECRET']); });
test('configuration matrix aggregates missing configuration', () => { const matrix = configurationMatrix([environmentContract({ name: 'production', requiredVariables: ['A'], values: {} })]); assert.equal(matrix.missingCount, 1); });
test('required unconfigured connector blocks readiness', () => assert.equal(connectorReadiness([{ id: 'acled', required: true, state: 'NOT_CONFIGURED' }]).ready, false));
test('stale required source blocks readiness', () => assert.equal(sourceReadiness({ events: [{ id: 'usgs', required: true, state: 'HEALTHY', fresh: false }] }).ready, false));
