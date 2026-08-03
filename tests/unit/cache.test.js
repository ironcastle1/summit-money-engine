import test from 'node:test';
import assert from 'node:assert/strict';
import { TtlCache } from '../../src/infra/cache/ttl-cache.js';

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

test('ttl cache returns hits and refreshes expired values', async () => {
  const cache = new TtlCache();
  let loads = 0;
  const loader = async () => ++loads;
  const first = await cache.getOrLoad('key', { ttlMs: 20 }, loader);
  const second = await cache.getOrLoad('key', { ttlMs: 20 }, loader);
  assert.equal(first.value, 1);
  assert.equal(second.value, 1);
  assert.equal(second.cache, 'HIT');
  await wait(25);
  const third = await cache.getOrLoad('key', { ttlMs: 20 }, loader);
  assert.equal(third.value, 2);
});

test('ttl cache coalesces concurrent loads', async () => {
  const cache = new TtlCache();
  let loads = 0;
  const loader = async () => {
    loads += 1;
    await wait(15);
    return 7;
  };
  const values = await Promise.all(Array.from({ length: 8 }, () => cache.getOrLoad('same', { ttlMs: 100 }, loader)));
  assert.equal(loads, 1);
  assert.ok(values.every(result => result.value === 7));
});

test('ttl cache can serve stale data after upstream failure', async () => {
  const cache = new TtlCache();
  cache.set('stale', { ok: true }, 1, null, Date.now() - 10);
  const result = await cache.getOrLoad('stale', { ttlMs: 1, staleMs: 1000 }, async () => { throw new Error('offline'); });
  assert.equal(result.cache, 'STALE');
  assert.deepEqual(result.value, { ok: true });
});
