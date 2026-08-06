import test from 'node:test';
import assert from 'node:assert/strict';
import { SourceRegistry } from '../../src/sources/source-registry.js';
import { createEvent } from '../../src/domain/events/event-schema.js';

function source(id, events) {
  let state = 'IDLE';
  return {
    id, name: id, configured: true, weight: 1, refreshMs: 1_000, staleMs: 5_000,
    async load() { state = 'ONLINE'; return { events, health: this.health() }; },
    health() { return { id, name: id, state, configured: true, recordCount: events.length }; }
  };
}

test('legacy source registry is backed by the ingestion platform', async () => {
  const event = createEvent({ source: 'Test', sourceId: '1', title: 'Test event', category: 'conflict', lat: 1, lon: 2, time: Date.now(), severity: 2 });
  const registry = new SourceRegistry().register(source('test-source', [event]));
  const snapshot = await registry.snapshot({ force: true });
  assert.equal(snapshot.eventCount, 1);
  assert.equal(snapshot.ingestionState, 'COMPLETE');
  assert.ok(snapshot.ingestionRunId);
  assert.equal(registry.health()['test-source'].pipelineState, 'ONLINE');
  assert.equal(registry.ingestionPlatform().provenance.stats().entries, 1);
});
