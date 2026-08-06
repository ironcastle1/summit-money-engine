import test from 'node:test';
import assert from 'node:assert/strict';
import { NormalizationPipeline } from '../../src/ingestion/normalization-pipeline.js';
import { SchemaRegistry } from '../../src/ingestion/schema-registry.js';
import { DeduplicationIndex } from '../../src/ingestion/deduplication-index.js';
import { DeadLetterRepository, ProvenanceRepository } from '../../src/ingestion/repositories.js';
import { createSourceDescriptor } from '../../src/ingestion/source-descriptor.js';

function context() {
  return {
    descriptor: createSourceDescriptor({ id: 'wire', name: 'Wire', attribution: 'Wire service' }),
    recordType: 'event', schemaVersion: 1,
    externalId: raw => raw.id,
    observedAt: raw => raw.time,
    sourceUrl: raw => raw.url,
    normalize: raw => ({ title: raw.headline.trim(), category: raw.category, url: raw.url }),
    retrievedAt: '2026-08-01T13:00:00Z'
  };
}

test('normalization pipeline validates, deduplicates and records provenance', async () => {
  const schemas = new SchemaRegistry().register('event', 1, record => record.title ? [] : [{ path: 'title', code: 'REQUIRED' }]);
  const provenance = new ProvenanceRepository();
  const deadLetters = new DeadLetterRepository();
  const pipeline = new NormalizationPipeline({ schemaRegistry: schemas, deduplication: new DeduplicationIndex(), provenance, deadLetters })
    .use('uppercase-category', envelope => ({ category: envelope.record.category.toUpperCase() }));
  const raw = { id: 'a', headline: ' Port disruption ', category: 'shipping', time: '2026-08-01T12:00:00Z', url: 'https://example.com/a' };
  const accepted = await pipeline.process(raw, context());
  assert.equal(accepted.state, 'ACCEPTED');
  assert.equal(accepted.envelope.processing['uppercase-category'].category, 'SHIPPING');
  assert.equal(provenance.stats().entries, 1);
  const duplicate = await pipeline.process(raw, context());
  assert.equal(duplicate.state, 'DUPLICATE');
  assert.equal(deadLetters.stats().total, 0);
});

test('invalid records are quarantined to the dead-letter repository', async () => {
  const schemas = new SchemaRegistry().register('event', 1, record => record.title ? [] : [{ path: 'title', code: 'REQUIRED' }]);
  const deadLetters = new DeadLetterRepository();
  const pipeline = new NormalizationPipeline({ schemaRegistry: schemas, deduplication: new DeduplicationIndex(), provenance: new ProvenanceRepository(), deadLetters });
  const invalidContext = { ...context(), normalize: () => ({ category: 'shipping' }) };
  const result = await pipeline.process({ id: 'bad', time: '2026-08-01T12:00:00Z' }, invalidContext);
  assert.equal(result.state, 'REJECTED');
  assert.equal(deadLetters.stats().unresolved, 1);
});
