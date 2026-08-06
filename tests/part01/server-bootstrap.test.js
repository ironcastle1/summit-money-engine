import test from 'node:test';
import assert from 'node:assert/strict';
import { startMerlinServer } from '../../server.js';

test('server bootstrap exposes startup diagnostics and stops cleanly', async () => {
  const runtime = await startMerlinServer({
    env: {
      NODE_ENV: 'test',
      LOG_LEVEL: 'fatal',
      SESSION_SECRET: 'test-secret-that-is-long-enough-for-runtime',
      PUBLIC_ORIGIN: 'http://127.0.0.1'
    },
    host: '127.0.0.1',
    port: 0,
    attachProcessHandlers: false
  });

  const address = runtime.server.address();
  const response = await fetch(`http://127.0.0.1:${address.port}/api/ops/startup`);
  const payload = await response.json();
  assert.equal(response.status, 200);
  assert.equal(payload.version, '23.0.0-merlin');
  assert.equal(payload.ready, true);

  const stopped = await runtime.stop('test');
  assert.equal(stopped.state, 'STOPPED');
  assert.equal(runtime.server.listening, false);
});
