import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { JsonDocumentStore } from '../../src/infra/persistence/json-document-store.js';
import { AccountRepository } from '../../src/repositories/account-repository.js';
import { SessionRepository } from '../../src/repositories/session-repository.js';
import { SubscriptionRepository } from '../../src/repositories/subscription-repository.js';
import { AuditRepository } from '../../src/repositories/audit-repository.js';
import { UsageRepository } from '../../src/repositories/usage-repository.js';
import { AuditService } from '../../src/services/audit-service.js';
import { AuthService } from '../../src/services/auth-service.js';
import { EntitlementService } from '../../src/services/entitlement-service.js';
import { UserDataRepository } from '../../src/repositories/user-data-repository.js';
import { UserDataService } from '../../src/services/user-data-service.js';

async function fixture() {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'merlin-account-'));
  const filePath = path.join(directory, 'accounts.json');
  const store = new JsonDocumentStore({ filePath, defaultValue: { users: [], sessions: [], subscriptions: [], userData: {}, usage: {}, audit: [], webhooks: [] } });
  await store.load();
  const accounts = new AccountRepository(store);
  const sessions = new SessionRepository(store);
  const subscriptions = new SubscriptionRepository(store);
  const audit = new AuditService(new AuditRepository(store));
  const auth = new AuthService({ accounts, sessions, audit, secret: 'test-secret-with-more-than-thirty-two-characters', cookieName: 'merlin_session', sessionTtlMs: 3600000, allowRegistration: true, bootstrap: {} });
  const entitlements = new EntitlementService({ subscriptions, usage: new UsageRepository(store) });
  const userData = new UserDataService({ repository: new UserDataRepository(store), entitlements });
  return { directory, filePath, store, accounts, sessions, subscriptions, audit, auth, entitlements, userData };
}

test('JSON document store serializes concurrent atomic updates', async t => {
  const fx = await fixture(); t.after(() => rm(fx.directory, { recursive: true, force: true }));
  await Promise.all(Array.from({ length: 20 }, (_, index) => fx.store.update(document => { document.audit.push({ index }); })));
  const document = await fx.store.read();
  assert.equal(document.audit.length, 20);
  assert.equal(JSON.parse(await readFile(fx.filePath, 'utf8')).audit.length, 20);
});

test('registration, login, session authentication, and logout work together', async t => {
  const fx = await fixture(); t.after(() => rm(fx.directory, { recursive: true, force: true }));
  const registered = await fx.auth.register({ email: 'user@example.com', password: 'SecurePassword!2026', displayName: 'User' });
  assert.equal(registered.user.email, 'user@example.com');
  const request = { headers: { cookie: `merlin_session=${registered.token}` } };
  const authenticated = await fx.auth.authenticate(request);
  assert.equal(authenticated.user.id, registered.user.id);
  assert.equal(fx.auth.verifyCsrf(authenticated, registered.csrfToken), true);
  await fx.auth.logout(request);
  assert.equal(await fx.auth.authenticate(request), null);
  const loggedIn = await fx.auth.login({ email: 'user@example.com', password: 'SecurePassword!2026' });
  assert.equal(loggedIn.user.id, registered.user.id);
});

test('duplicate registration and invalid password fail closed', async t => {
  const fx = await fixture(); t.after(() => rm(fx.directory, { recursive: true, force: true }));
  await fx.auth.register({ email: 'user@example.com', password: 'SecurePassword!2026' });
  await assert.rejects(() => fx.auth.register({ email: 'user@example.com', password: 'SecurePassword!2026' }), error => error.code === 'CONFLICT');
  await assert.rejects(() => fx.auth.login({ email: 'user@example.com', password: 'WrongPassword!2026' }), error => error.code === 'UNAUTHORIZED');
});

test('user data service enforces free-plan bucket limits', async t => {
  const fx = await fixture(); t.after(() => rm(fx.directory, { recursive: true, force: true }));
  const registered = await fx.auth.register({ email: 'user@example.com', password: 'SecurePassword!2026' });
  const user = await fx.accounts.findById(registered.user.id);
  const saved = await fx.userData.put(user, 'workspaces', [{ id: '1' }, { id: '2' }]);
  assert.equal(saved.length, 2);
  await assert.rejects(() => fx.userData.put(user, 'workspaces', [{ id: '1' }, { id: '2' }, { id: '3' }]), /limit/i);
  await assert.rejects(() => fx.userData.put(user, 'unknown', []), /bucket/i);
});
