import test from 'node:test';
import assert from 'node:assert/strict';
import { createRecordEnvelope, withProcessing } from '../../src/ingestion/record-envelope.js';
import { createProvenance, provenanceFromEnvelope } from '../../src/ingestion/provenance.js';
import { createSourceDescriptor } from '../../src/ingestion/source-descriptor.js';

test('record envelopes produce stable source-scoped identifiers', () => {
  const first = createRecordEnvelope({ sourceId: 'test', externalId: 'abc', observedAt: '2026-08-01T12:00:00Z', record: { title: 'A' } });
  const second = createRecordEnvelope({ sourceId: 'test', externalId: 'abc', observedAt: '2026-08-01T12:00:00Z', record: { title: 'B' } });
  assert.equal(first.id, second.id);
  assert.equal(first.recordType, 'event');
  assert.ok(Object.isFrozen(first.record));
  assert.equal(withProcessing(first, { normalized: true }).processing.normalized, true);
});

test('provenance rejects unsafe URLs and preserves attribution', () => {
  const provenance = createProvenance({ sourceId: 'test', recordId: 'r1', sourceUrl: 'javascript:alert(1)', attribution: 'Official source' });
  assert.equal(provenance.sourceUrl, null);
  assert.equal(provenance.attribution, 'Official source');
});

test('provenance derives mode, hash and chain from envelope context', () => {
  const descriptor = createSourceDescriptor({ id: 'catalog', name: 'Catalog', mode: 'CATALOG', license: 'Open' });
  const envelope = createRecordEnvelope({ sourceId: 'catalog', externalId: '1', observedAt: Date.now(), record: { title: 'Port' } });
  const provenance = provenanceFromEnvelope(envelope, descriptor, { transformationChain: ['normalize', 'validate'], contentHash: 'abc' });
  assert.equal(provenance.mode, 'CATALOG');
  assert.equal(provenance.contentHash, 'abc');
  assert.deepEqual(provenance.transformationChain, ['normalize', 'validate']);
});
