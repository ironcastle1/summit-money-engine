import test from 'node:test';
import assert from 'node:assert/strict';
import { SchemaRegistry } from '../../src/ingestion/schema-registry.js';
import { DeduplicationIndex } from '../../src/ingestion/deduplication-index.js';
import { createRecordEnvelope } from '../../src/ingestion/record-envelope.js';
import { RecordValidationError } from '../../src/ingestion/errors.js';

function envelope(id, title, time = '2026-08-01T12:00:00Z') {
  return createRecordEnvelope({ sourceId: 'test', externalId: id, observedAt: time, record: { title, category: 'conflict' } });
}

test('schema registry validates versioned records', () => {
  const schemas = new SchemaRegistry().register('event', 1, record => record.title ? [] : [{ path: 'title', code: 'REQUIRED' }]);
  assert.equal(schemas.validate(envelope('1', 'Valid')).valid, true);
  const invalid = createRecordEnvelope({ sourceId: 'test', externalId: '2', observedAt: Date.now(), record: {} });
  assert.equal(schemas.validate(invalid).valid, false);
  assert.throws(() => schemas.assert(invalid), RecordValidationError);
  assert.deepEqual(schemas.list(), [{ recordType: 'event', schemaVersion: 1 }]);
});

test('deduplication catches exact and semantic duplicates', () => {
  const index = new DeduplicationIndex({ similarityThreshold: 0.5 });
  const first = envelope('1', 'Port closure after major storm');
  const exact = createRecordEnvelope({ ...first, record: first.record });
  assert.equal(index.add(first).duplicate, false);
  assert.equal(index.add(exact).kind, 'EXACT');
  const semantic = envelope('2', 'Major storm causes port closure');
  const result = index.add(semantic);
  assert.equal(result.duplicate, true);
  assert.equal(result.kind, 'SEMANTIC');
  assert.ok(result.similarity >= 0.5);
});
