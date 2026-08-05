import test from 'node:test';
import assert from 'node:assert/strict';
import { DecisionSupportPlatformService } from '../../src/services/decision-support-platform-service.js';
test('platform builds snapshot from direct bundle without external connectors', async () => {
  const platform = new DecisionSupportPlatformService();
  const snapshot = await platform.snapshot({ owner: 'tester', bundle: { events: { events: [{ id: 'e1', category: 'conflict', title: 'Border clash', severity: 80, source: 'Test', time: new Date().toISOString() }] }, conflict: { theatres: [] }, hazards: { events: [] }, markets: { opportunities: [] }, countries: { profiles: [] }, logistics: { routes: [] }, opportunities: { opportunities: [] } } });
  assert.equal(snapshot.signals.length, 1);
  assert.equal(snapshot.cache, 'MISS');
  assert.equal(platform.catalog().version, '20.12.0');
  assert.equal(platform.diagnostics().service, 'decision-support');
});
