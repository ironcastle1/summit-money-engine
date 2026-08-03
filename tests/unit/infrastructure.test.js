import test from 'node:test';
import assert from 'node:assert/strict';
import { CircuitBreaker } from '../../src/infra/http/circuit-breaker.js';
import { SlidingWindowRateLimiter } from '../../src/http/rate-limiter.js';
import { RateLimitError } from '../../src/core/errors.js';
import { extractItems, extractTag, decodeXml } from '../../src/util/xml.js';


test('circuit breaker opens and transitions to half-open', () => {
  const breaker = new CircuitBreaker({ failureThreshold: 2, cooldownMs: 100 });
  assert.equal(breaker.canExecute(0), true);
  breaker.failure(new Error('a'), 0);
  breaker.failure(new Error('b'), 0);
  assert.equal(breaker.snapshot(0).state, 'OPEN');
  assert.equal(breaker.canExecute(50), false);
  assert.equal(breaker.canExecute(101), true);
  assert.equal(breaker.snapshot(101).state, 'HALF_OPEN');
  breaker.success();
  assert.equal(breaker.snapshot(101).state, 'CLOSED');
});

test('rate limiter enforces a sliding window', () => {
  const limiter = new SlidingWindowRateLimiter({ limit: 2, windowMs: 1000 });
  limiter.consume('ip', 0);
  limiter.consume('ip', 1);
  assert.throws(() => limiter.consume('ip', 2), RateLimitError);
  assert.doesNotThrow(() => limiter.consume('ip', 1001));
});

test('xml utilities extract namespaced RSS data', () => {
  const xml = '<rss><channel><item><title><![CDATA[A &amp; B]]></title><georss:point>12.3 45.6</georss:point></item></channel></rss>';
  const items = extractItems(xml);
  assert.equal(items.length, 1);
  assert.equal(extractTag(items[0], 'georss:point'), '12.3 45.6');
  assert.equal(decodeXml(extractTag(items[0], 'title')), 'A & B');
});
