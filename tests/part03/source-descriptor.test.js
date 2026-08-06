import test from 'node:test';
import assert from 'node:assert/strict';
import { createSourceDescriptor, assertSourceAdapter } from '../../src/ingestion/source-descriptor.js';
import { SourceContractError } from '../../src/ingestion/errors.js';

test('source descriptors normalize capabilities and operating limits', () => {
  const descriptor = createSourceDescriptor({
    id: 'USGS-LIVE', name: 'USGS Live', group: 'events', refreshMs: -1,
    capabilities: ['events', 'events', 'earthquakes'], countries: ['us', 'gb']
  });
  assert.equal(descriptor.id, 'usgs-live');
  assert.deepEqual(descriptor.capabilities, ['events', 'earthquakes']);
  assert.deepEqual(descriptor.countries, ['US', 'GB']);
  assert.ok(descriptor.refreshMs > 0);
  assert.ok(Object.isFrozen(descriptor));
});

test('invalid source contracts fail before ingestion starts', () => {
  assert.throws(() => createSourceDescriptor({ id: '!' }), SourceContractError);
  assert.throws(() => assertSourceAdapter({ id: 'valid-source' }), SourceContractError);
  assert.equal(assertSourceAdapter({ id: 'valid-source', load() { return []; } }).id, 'valid-source');
});
