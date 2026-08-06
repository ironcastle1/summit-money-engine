import test from 'node:test';
import assert from 'node:assert/strict';
import { RetryPolicy } from '../../src/ingestion/retry-policy.js';
import { mapConcurrent, withTimeout } from '../../src/ingestion/concurrency-pool.js';

test('retry policy retries explicitly retryable failures', async () => {
  let attempts = 0;
  const retries = [];
  const policy = new RetryPolicy({ maximumAttempts: 3, baseDelayMs: 0, jitterRatio: 0 });
  const value = await policy.execute(() => {
    attempts += 1;
    if (attempts < 3) throw Object.assign(new Error('temporary'), { retryable: true });
    return 42;
  }, { onRetry: (_, attempt) => retries.push(attempt) });
  assert.equal(value, 42);
  assert.equal(attempts, 3);
  assert.deepEqual(retries, [1, 2]);
});

test('concurrency pool preserves input order while running workers concurrently', async () => {
  let active = 0;
  let maximum = 0;
  const results = await mapConcurrent([30, 10, 20, 5], async delay => {
    active += 1;
    maximum = Math.max(maximum, active);
    await new Promise(resolve => setTimeout(resolve, delay));
    active -= 1;
    return delay * 2;
  }, { concurrency: 2 });
  assert.deepEqual(results.map(result => result.value), [60, 20, 40, 10]);
  assert.equal(maximum, 2);
});

test('timeout wrapper rejects stalled operations', async () => {
  await assert.rejects(() => withTimeout(() => new Promise(() => {}), 10, () => new Error('timed out')), /timed out/);
});
