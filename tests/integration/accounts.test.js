import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdtemp, rm } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { createApplication } from '../../src/app/create-application.js';
import { loadConfig } from '../../src/config/load-config.js';
import { createLogger } from '../../src/core/logger.js';

let directory;
let server;
let application;
let baseUrl;

function sessionCookie(response) {
  const value = response.headers.get('set-cookie') || '';
  const match = value.match(/summit_session=([^;]+)/);
  return match ? `summit_session=${match[1]}` : '';
}

async function post(pathname, body, options = {}) {
  return fetch(`${baseUrl}${pathname}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...(options.cookie ? { cookie: options.cookie } : {}), ...(options.csrf ? { 'x-csrf-token': options.csrf } : {}) },
    body: JSON.stringify(body || {})
  });
}

test.before(async () => {
  directory = await mkdtemp(path.join(os.tmpdir(), 'summit-api-account-'));
  const config = loadConfig({
    NODE_ENV: 'test', LOG_LEVEL: 'fatal', PORT: '4173',
    ACCOUNT_DATA_FILE: path.join(directory, 'accounts.json'),
    SESSION_SECRET: 'integration-secret-with-more-than-thirty-two-characters',
    OWNER_EMAIL: 'owner@example.com', OWNER_PASSWORD: 'OwnerPassword!2026',
    PUBLIC_ORIGIN: 'http://localhost:4173'
  });
  application = await createApplication({ config, logger: createLogger({ level: 'fatal', service: 'accounts-test' }) });
  server = createServer(application.handle);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

test.after(async () => {
  await new Promise(resolve => server.close(resolve));
  await application.close();
  await rm(directory, { recursive: true, force: true });
});

test('billing plans expose GBP prices and explicit provider state', async () => {
  const response = await fetch(`${baseUrl}/api/billing/plans`);
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.plans.find(plan => plan.id === 'PRO').currency, 'GBP');
  assert.equal(body.providers.stripe.state, 'NOT_CONFIGURED');
  assert.equal(body.providers.paypal.state, 'NOT_CONFIGURED');
  assert.equal(body.providers.coinbase.state, 'NOT_CONFIGURED');
});

test('registration creates a secure session and authenticated account response', async () => {
  const response = await post('/api/auth/register', { email: 'member@example.com', password: 'MemberPassword!2026', displayName: 'Member' });
  const body = await response.json();
  assert.equal(response.status, 201);
  assert.equal(body.authenticated, true);
  assert.equal(body.user.role, 'USER');
  assert.equal(body.entitlements.planId, 'FREE');
  assert.ok(body.csrfToken);
  const cookie = sessionCookie(response);
  assert.match(cookie, /^summit_session=/);
  const session = await fetch(`${baseUrl}/api/auth/session`, { headers: { cookie } });
  const sessionBody = await session.json();
  assert.equal(sessionBody.authenticated, true);
  assert.equal(sessionBody.user.email, 'member@example.com');
});

test('authenticated server data requires CSRF and persists valid values', async () => {
  const login = await post('/api/auth/login', { email: 'member@example.com', password: 'MemberPassword!2026' });
  const loginBody = await login.json();
  const cookie = sessionCookie(login);
  const denied = await post('/api/user-data/watchlists', { value: ['btc-usd'] }, { cookie });
  assert.equal(denied.status, 403);
  const saved = await post('/api/user-data/watchlists', { value: ['btc-usd', 'eth-usd'] }, { cookie, csrf: loginBody.csrfToken });
  assert.equal(saved.status, 200);
  const read = await fetch(`${baseUrl}/api/user-data/watchlists`, { headers: { cookie } });
  assert.deepEqual((await read.json()).value, ['btc-usd', 'eth-usd']);
});

test('owner can inspect admin metrics and grant a plan', async () => {
  const login = await post('/api/auth/login', { email: 'owner@example.com', password: 'OwnerPassword!2026' });
  const body = await login.json();
  const cookie = sessionCookie(login);
  assert.equal(body.user.role, 'OWNER');
  const usersResponse = await fetch(`${baseUrl}/api/admin/users`, { headers: { cookie } });
  const users = (await usersResponse.json()).users;
  const member = users.find(user => user.email === 'member@example.com');
  assert.ok(member);
  const grant = await post(`/api/admin/users/${member.id}/subscription`, { planId: 'PRO', days: 31 }, { cookie, csrf: body.csrfToken });
  assert.equal(grant.status, 200);
  assert.equal((await grant.json()).subscription.planId, 'PRO');
  const metrics = await fetch(`${baseUrl}/api/admin/metrics`, { headers: { cookie } });
  const metricsBody = await metrics.json();
  assert.equal(metrics.status, 200);
  assert.ok(metricsBody.users >= 2);
  assert.equal(metricsBody.byPlan.PRO, 1);
});

test('ordinary users cannot access admin endpoints', async () => {
  const login = await post('/api/auth/login', { email: 'member@example.com', password: 'MemberPassword!2026' });
  const cookie = sessionCookie(login);
  const response = await fetch(`${baseUrl}/api/admin/metrics`, { headers: { cookie } });
  assert.equal(response.status, 403);
});
