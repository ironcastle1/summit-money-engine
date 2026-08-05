import test from 'node:test';
import assert from 'node:assert/strict';
import { loadConfig } from '../../src/config/load-config.js';
import { assertStartupReadiness, buildStartupDiagnostics } from '../../src/deployment/startup-diagnostics.js';

test('development startup reports optional connector warnings without blocking', () => {
  const config = loadConfig({ NODE_ENV: 'development' });
  const diagnostics = buildStartupDiagnostics(config);
  assert.equal(diagnostics.ready, true);
  assert.equal(diagnostics.status, 'READY_WITH_WARNINGS');
  assert.ok(diagnostics.warnings.some(entry => entry.code === 'ACLED_NOT_CONFIGURED'));
  assert.equal(diagnostics.connectorSummary.total, 10);
  assert.doesNotThrow(() => assertStartupReadiness(diagnostics));
});

test('production startup blocks placeholder origin', () => {
  const config = loadConfig({
    NODE_ENV: 'production',
    SESSION_SECRET: 'f'.repeat(48),
    SECURE_COOKIES: 'true'
  });
  const diagnostics = buildStartupDiagnostics(config);
  assert.equal(diagnostics.ready, false);
  assert.ok(diagnostics.blockers.some(entry => entry.code === 'PUBLIC_ORIGIN_PLACEHOLDER'));
  assert.throws(() => assertStartupReadiness(diagnostics), error => error.code === 'STARTUP_READINESS_FAILED');
});

test('production startup accepts a secure real origin', () => {
  const config = loadConfig({
    NODE_ENV: 'production',
    PUBLIC_ORIGIN: 'https://merlin.example.net',
    SESSION_SECRET: '9dK4s2pLm7Qw3nV8cX5zR1tY6uH0aB4e',
    SECURE_COOKIES: 'true'
  });
  const diagnostics = buildStartupDiagnostics(config);
  assert.equal(diagnostics.ready, true);
  assert.equal(diagnostics.blockers.length, 0);
});
