import test from 'node:test';
import assert from 'node:assert/strict';
import { ShutdownCoordinator } from '../../src/core/shutdown-coordinator.js';

test('shutdown closes resources in reverse registration order and is idempotent', async () => {
  const order = [];
  const coordinator = new ShutdownCoordinator({ taskTimeoutMs: 500 })
    .register('database', async () => order.push('database'))
    .register('http', async () => order.push('http'));

  const [first, second] = await Promise.all([
    coordinator.shutdown('test'),
    coordinator.shutdown('duplicate')
  ]);

  assert.deepEqual(order, ['http', 'database']);
  assert.equal(first.state, 'STOPPED');
  assert.equal(second, first);
  assert.equal(coordinator.state, 'STOPPED');
});

test('shutdown records failures and continues closing remaining resources', async () => {
  const order = [];
  const coordinator = new ShutdownCoordinator({ taskTimeoutMs: 500 })
    .register('first', async () => order.push('first'))
    .register('broken', async () => {
      order.push('broken');
      throw new Error('close failed');
    })
    .register('last', async () => order.push('last'));

  const result = await coordinator.shutdown('failure-test');
  assert.deepEqual(order, ['last', 'broken', 'first']);
  assert.equal(result.state, 'FAILED');
  assert.equal(result.results.filter(entry => entry.status === 'FAILED').length, 1);
});
