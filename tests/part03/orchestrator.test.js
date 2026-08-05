import test from 'node:test';
import assert from 'node:assert/strict';
import { IngestionPlatform } from '../../src/ingestion/ingestion-platform.js';

function adapter(id, records, options = {}) {
  return {
    descriptor: { id, name: id, group: 'event', timeoutMs: options.timeoutMs || 500, maximumRecords: 100 },
    recordType: 'event',
    async load({ checkpoint }) {
      if (options.error) throw options.error;
      return { records, checkpoint: { page: (checkpoint?.page || 0) + 1 }, metadata: { pageSize: records.length } };
    },
    normalize: raw => raw,
    externalId: raw => raw.id,
    observedAt: raw => raw.time
  };
}

test('orchestrator ingests multiple sources and persists checkpoints', async () => {
  const platform = new IngestionPlatform({ concurrency: 2, retryOptions: { maximumAttempts: 1 } });
  platform.register(adapter('alpha', [{ id: 'a', title: 'A', time: '2026-08-01T12:00:00Z' }]));
  platform.register(adapter('beta', [{ id: 'b', title: 'B', time: '2026-08-01T12:01:00Z' }]));
  const run = await platform.ingest();
  assert.equal(run.state, 'COMPLETE');
  assert.equal(run.accepted, 2);
  assert.equal(run.records.length, 2);
  assert.equal(platform.checkpoints.get('alpha').checkpoint.page, 1);
  assert.equal(platform.status().latestRun.id, run.id);
});

test('orchestrator degrades rather than discarding successful sources', async () => {
  const platform = new IngestionPlatform({ retryOptions: { maximumAttempts: 1 } });
  platform.register(adapter('good', [{ id: 'ok', title: 'OK', time: Date.now() }]));
  platform.register(adapter('bad', [], { error: Object.assign(new Error('down'), { code: 'DOWN' }) }));
  const run = await platform.ingest();
  assert.equal(run.state, 'DEGRADED');
  assert.equal(run.accepted, 1);
  assert.equal(run.sourcesFailed, 1);
  assert.equal(platform.health.snapshot('bad').state, 'OFFLINE');
});

test('deduplication resets between snapshots but remains active within each run', async () => {
  const platform = new IngestionPlatform();
  platform.register(adapter('feed', [
    { id: '1', title: 'Same event', time: '2026-08-01T12:00:00Z' },
    { id: '1', title: 'Same event', time: '2026-08-01T12:00:00Z' }
  ]));
  const first = await platform.ingest();
  const second = await platform.ingest();
  assert.equal(first.accepted, 1);
  assert.equal(first.duplicates, 1);
  assert.equal(second.accepted, 1);
});
