import test from 'node:test';
import assert from 'node:assert/strict';
import { IngestionScheduler } from '../../src/ingestion/ingestion-scheduler.js';

test('scheduler executes due jobs and records status', async () => {
  let now = 1_000;
  let runs = 0;
  const scheduler = new IngestionScheduler({ clock: () => now, tickMs: 1_000 });
  scheduler.register('events', async () => { runs += 1; return runs; }, { intervalMs: 2_000, immediate: true });
  assert.equal(await scheduler.tick(now), 1);
  assert.equal(runs, 1);
  assert.equal(await scheduler.tick(now + 500), 0);
  now += 2_500;
  assert.equal(await scheduler.tick(now), 1);
  const status = scheduler.status()[0];
  assert.equal(status.runs, 2);
  assert.equal(status.failures, 0);
});

test('scheduler exposes failed runs without losing the job', async () => {
  let now = 5_000;
  const scheduler = new IngestionScheduler({ clock: () => now, tickMs: 1_000 });
  scheduler.register('bad', async () => { throw new Error('failure'); }, { intervalMs: 1_000, immediate: true });
  await assert.rejects(() => scheduler.tick(now), /failure/);
  assert.equal(scheduler.status()[0].failures, 1);
});
