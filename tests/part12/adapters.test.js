import test from 'node:test';
import assert from 'node:assert/strict';
import { signalsFromConflict, signalsFromCountries, signalsFromHazards, signalsFromMarkets } from '../../src/decision-support/signal-adapters.js';
test('domain adapters create normalized decision signals', () => {
  assert.equal(signalsFromConflict({ theatres: [{ id: 't1', name: 'Theatre', phase: 'ACTIVE', eventCount: 3, risk: { score: 70 }, confidence: { score: 75 }, center: { lat: 1, lon: 2 }, timeline: [] }] })[0].domain, 'CONFLICT');
  assert.equal(signalsFromHazards({ events: [{ id: 'h1', title: 'Flood', materiality: { score: 75 } }] })[0].domain, 'HAZARDS');
  assert.equal(signalsFromMarkets({ opportunities: [{ id: 'm1', title: 'Oil', score: 65 }] })[0].domain, 'MARKETS');
  assert.equal(signalsFromCountries({ profiles: [{ id: 'GB', country: { name: 'United Kingdom' }, risk: { score: 20 } }] })[0].domain, 'COUNTRIES');
});
