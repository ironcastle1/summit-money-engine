import test from 'node:test';
import assert from 'node:assert/strict';
import { IngestionCheckpointRepository, DeadLetterRepository, ProvenanceRepository, IngestionRunRepository } from '../../src/ingestion/repositories.js';
import { SourceHealthMonitor } from '../../src/ingestion/source-health-monitor.js';

test('ingestion repositories retain bounded operational state', () => {
  const checkpoints = new IngestionCheckpointRepository();
  checkpoints.set('source', 'default', { cursor: 5 });
  assert.equal(checkpoints.get('source').checkpoint.cursor, 5);

  const dead = new DeadLetterRepository({ maximum: 10 });
  const entry = dead.add({ sourceId: 'source', error: { code: 'BAD' } });
  assert.equal(dead.stats().unresolved, 1);
  dead.resolve(entry.id, { action: 'ignored' });
  assert.equal(dead.stats().unresolved, 0);

  const provenance = new ProvenanceRepository({ maximum: 100 });
  provenance.add({ id: 'p1', sourceId: 'source', recordId: 'r1' });
  assert.equal(provenance.byRecord('r1').length, 1);

  const runs = new IngestionRunRepository({ maximum: 10 });
  runs.add({ id: 'run-1', state: 'COMPLETE' });
  assert.equal(runs.latest().id, 'run-1');
});

test('health monitor reports source success rate and latency percentiles', () => {
  const monitor = new SourceHealthMonitor();
  monitor.configure({ id: 'source', name: 'Source', configured: true, mode: 'LIVE' });
  monitor.started('source', 1_000);
  monitor.completed('source', { accepted: 4, rejected: 1, duplicates: 2, degraded: true }, 120, 2_000);
  monitor.started('source', 3_000);
  monitor.failed('source', Object.assign(new Error('offline'), { code: 'DOWN' }), 300, 4_000);
  const health = monitor.snapshot('source');
  assert.equal(health.successRate, 0.5);
  assert.equal(health.recordsAccepted, 4);
  assert.equal(health.state, 'DEGRADED');
  assert.equal(health.latency.maximumMs, 300);
});
