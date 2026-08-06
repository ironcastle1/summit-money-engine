import test from 'node:test';
import assert from 'node:assert/strict';
import { commercialMetrics, commercialCsv, commercialJson, commercialSummary } from '../../src/commercial-operations/index.js';
test('commercial metrics calculate recurring revenue and retention', () => { const metrics = commercialMetrics({ tenants: [{ id: 'a', state: 'ACTIVE', planId: 'PRO' }, { id: 'b', state: 'CANCELLED', planId: 'TEAM' }], seats: [{ active: true }], supportCases: [], feedback: [], planAmounts: { PRO: 2900, TEAM: 9900 } }); assert.equal(metrics.mrrMinor, 2900); assert.equal(metrics.grossLogoRetentionPercent, 50); });
test('commercial export formats contain usable data', () => { assert.match(commercialCsv([{ name: 'A', state: 'ACTIVE' }]), /"name","state"/); assert.match(commercialJson({ a: 1 }), /"a": 1/); assert.match(commercialSummary({ metrics: { tenants: 1 } }), /Tenants: 1/); });
