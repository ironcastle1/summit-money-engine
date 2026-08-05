import test from 'node:test';
import assert from 'node:assert/strict';
import { applySecurityHeaders, buildContentSecurityPolicy } from '../../src/security/security-policy.js';

class HeaderRecorder {
  headers = new Map();
  setHeader(name, value) {
    this.headers.set(String(name).toLowerCase(), value);
  }
  getHeader(name) {
    return this.headers.get(String(name).toLowerCase());
  }
}

test('content security policy is restrictive and permits required map assets', () => {
  const policy = buildContentSecurityPolicy({ environment: 'production' });
  assert.match(policy, /default-src 'self'/);
  assert.match(policy, /frame-ancestors 'none'/);
  assert.match(policy, /object-src 'none'/);
  assert.match(policy, /img-src 'self' data: blob: https:/);
  assert.doesNotMatch(policy, /script-src[^;]*'unsafe-eval'/);
});

test('production security headers include HSTS', () => {
  const response = new HeaderRecorder();
  applySecurityHeaders(response, { environment: 'production', isProduction: true });
  assert.equal(response.getHeader('x-frame-options'), 'DENY');
  assert.match(response.getHeader('strict-transport-security'), /max-age=31536000/);
  assert.match(response.getHeader('content-security-policy'), /form-action 'self'/);
});
