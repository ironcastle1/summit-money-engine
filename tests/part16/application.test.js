import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { createApplication } from '../../src/app/create-application.js';
import { loadConfig } from '../../src/config/load-config.js';
import { createLogger } from '../../src/core/logger.js';

let server;
let application;
let baseUrl;

test.before(async () => {
  const config = loadConfig({ NODE_ENV: 'test', LOG_LEVEL: 'fatal', PORT: '4175' });
  application = await createApplication({ config, logger: createLogger({ level: 'fatal', service: 'part16-test' }) });
  server = createServer(application.handle);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

test.after(async () => {
  server.closeAllConnections?.();
  await new Promise(resolve => server.close(resolve));
  await application.close();
});

test('security catalog and diagnostics endpoints are available', async () => {
  const catalog = await fetch(`${baseUrl}/api/security/catalog`);
  assert.equal(catalog.status, 200);
  assert.equal((await catalog.json()).platform, 'MERLIN_SECURITY_COMPLIANCE');
  const diagnostics = await fetch(`${baseUrl}/api/security/diagnostics`);
  assert.equal(diagnostics.status, 200);
});

test('security seed and snapshot expose controls, posture and audit verification', async () => {
  const seed = await fetch(`${baseUrl}/api/security/seed`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' });
  assert.equal(seed.status, 201);
  const snapshot = await fetch(`${baseUrl}/api/security/snapshot`);
  const body = await snapshot.json();
  assert.equal(snapshot.status, 200);
  assert.ok(body.assessments.length >= 10);
  assert.equal(body.auditVerification.valid, true);
});

test('security access and incident endpoints perform real calculations', async () => {
  const access = await fetch(`${baseUrl}/api/security/access/evaluate`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ subject: { id: 'a', tenantId: 't', role: 'ANALYST', clearance: 'CONFIDENTIAL' }, resource: { id: 'r', tenantId: 't', classification: 'CONFIDENTIAL' }, permission: 'security:read', context: { mfaSatisfied: true } }) });
  assert.equal(access.status, 200);
  assert.equal((await access.json()).decision, 'ALLOW');
  const incident = await fetch(`${baseUrl}/api/security/incidents`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ tenantId: 't', title: 'Exposure', regulatedData: true, confidentialityImpact: 90, affectedUsers: 1000 }) });
  assert.equal(incident.status, 201);
  assert.ok((await incident.json()).breachClock.notificationDeadline);
});
