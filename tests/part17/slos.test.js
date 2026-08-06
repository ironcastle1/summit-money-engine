import test from 'node:test';
import assert from 'node:assert/strict';
import { serviceLevelObjective, sliMeasurement, errorBudget, burnRate, availabilityWindow } from '../../src/reliability-operations/index.js';
test('error budgets use good and total evidence', () => { const slo = serviceLevelObjective({ id: 's', serviceId: 'api', indicator: 'AVAILABILITY', target: 99.9 }); const rows = [sliMeasurement({ serviceId: 'api', sloId: 's', good: 9995, total: 10000, value: 99.95 })]; const budget = errorBudget(slo, rows); assert.equal(budget.state, 'HEALTHY'); assert.equal(budget.actual, 99.95); });
test('exhausted SLOs and burn rates page operators', () => { const slo = serviceLevelObjective({ id: 's', serviceId: 'api', indicator: 'AVAILABILITY', target: 99.9 }); const rows = [sliMeasurement({ serviceId: 'api', sloId: 's', good: 970, total: 1000, value: 97 })]; assert.equal(errorBudget(slo, rows).state, 'EXHAUSTED'); assert.equal(burnRate(slo, rows, rows).page, true); });
test('availability windows preserve sample totals', () => { const result = availabilityWindow([{ good: 99, total: 100, recordedAt: new Date().toISOString() }], 60); assert.equal(result.availability, 99); });
