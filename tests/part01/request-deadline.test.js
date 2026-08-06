import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequestDeadline } from '../../src/http/request-deadline.js';

test('request deadline exposes elapsed and remaining time', async () => {
  const deadline = createRequestDeadline({ timeoutMs: 200 });
  assert.equal(deadline.signal.aborted, false);
  assert.ok(deadline.remainingMs() <= 200);
  await new Promise(resolve => setTimeout(resolve, 10));
  assert.ok(deadline.elapsedMs() >= 5);
  deadline.clear();
});

test('request deadline aborts long work', async () => {
  const deadline = createRequestDeadline({ timeoutMs: 100 });
  await new Promise(resolve => deadline.signal.addEventListener('abort', resolve, { once: true }));
  assert.equal(deadline.signal.aborted, true);
  assert.equal(deadline.signal.reason.code, 'REQUEST_DEADLINE_EXCEEDED');
  deadline.clear();
});
