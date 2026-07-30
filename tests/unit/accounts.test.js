import test from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPairSync, createHmac, verify } from 'node:crypto';
import { normalizeEmail, validateEmail, maskEmail } from '../../src/domain/accounts/email.js';
import { passwordStrength, validatePassword } from '../../src/domain/accounts/password-policy.js';
import { hashPassword, verifyPassword, passwordHashNeedsUpgrade } from '../../src/security/password-hasher.js';
import { normalizeRole, roleAtLeast, canManageRole } from '../../src/domain/accounts/roles.js';
import { buildEntitlements, hasFeature, withinLimit } from '../../src/domain/accounts/entitlements.js';
import { effectivePlanId, isSubscriptionActive, transitionAllowed } from '../../src/domain/accounts/subscription-state.js';
import { verifyCoinbaseSignature, verifyStripeSignature } from '../../src/security/webhook-signatures.js';
import { createCdpJwt } from '../../src/security/cdp-jwt.js';

test('email normalization and validation are deterministic', () => {
  assert.equal(normalizeEmail('  User@Example.COM '), 'user@example.com');
  assert.equal(validateEmail('User@example.com'), 'user@example.com');
  assert.equal(maskEmail('alessandro@example.com'), 'al********@example.com');
  assert.throws(() => validateEmail('not-an-email'), /invalid/);
});

test('password policy requires a long mixed password', () => {
  const result = passwordStrength('SecurePassword!2026');
  assert.equal(result.acceptable, true);
  assert.equal(validatePassword('SecurePassword!2026'), 'SecurePassword!2026');
  assert.throws(() => validatePassword('password'), /length|include/);
});

test('scrypt password hashes verify without preserving plaintext', async () => {
  const encoded = await hashPassword('SecurePassword!2026', { salt: '00112233445566778899aabbccddeeff' });
  assert.match(encoded, /^scrypt\$/);
  assert.equal(encoded.includes('SecurePassword'), false);
  assert.equal(await verifyPassword('SecurePassword!2026', encoded), true);
  assert.equal(await verifyPassword('WrongPassword!2026', encoded), false);
  assert.equal(passwordHashNeedsUpgrade(encoded), false);
});

test('role ordering prevents lower roles managing elevated accounts', () => {
  assert.equal(normalizeRole('admin'), 'ADMIN');
  assert.equal(roleAtLeast('OWNER', 'ADMIN'), true);
  assert.equal(roleAtLeast('USER', 'ANALYST'), false);
  assert.equal(canManageRole('ADMIN', 'USER'), true);
  assert.equal(canManageRole('ADMIN', 'OWNER'), false);
});

test('expired subscriptions fall back to free entitlements', () => {
  const user = { role: 'USER' };
  const expired = { planId: 'PRO', state: 'ACTIVE', currentPeriodEnd: '2020-01-01T00:00:00.000Z' };
  assert.equal(isSubscriptionActive(expired), false);
  assert.equal(effectivePlanId(expired), 'FREE');
  const entitlements = buildEntitlements(user, expired, { alertRules: 1 });
  assert.equal(entitlements.planId, 'FREE');
  assert.equal(hasFeature(entitlements, 'SHIPPING'), false);
  assert.equal(withinLimit(entitlements, 'alertRules', 2), true);
  assert.equal(withinLimit(entitlements, 'alertRules', 3), false);
});

test('subscription transition graph blocks invalid direct transitions', () => {
  assert.equal(transitionAllowed('ACTIVE', 'PAST_DUE'), true);
  assert.equal(transitionAllowed('EXPIRED', 'PAST_DUE'), false);
});

test('Stripe webhook verification binds timestamp and raw body', () => {
  const body = '{"id":"evt_1"}';
  const secret = 'whsec_test_secret';
  const timestamp = 1_800_000_000;
  const signature = createHmac('sha256', secret).update(`${timestamp}.${body}`).digest('hex');
  assert.equal(verifyStripeSignature(body, `t=${timestamp},v1=${signature}`, secret, 300, timestamp * 1000), true);
  assert.equal(verifyStripeSignature(`${body}x`, `t=${timestamp},v1=${signature}`, secret, 300, timestamp * 1000), false);
});

test('Coinbase webhook verification accepts v0 and rejects replayed timestamps', () => {
  const body = '{"id":"checkout_1"}';
  const secret = 'coinbase-secret';
  const timestamp = 1_800_000_000;
  const signature = createHmac('sha256', secret).update(`${timestamp}.${body}`).digest('hex');
  assert.equal(verifyCoinbaseSignature(body, `t=${timestamp},v0=${signature}`, secret, {}, 300, timestamp * 1000), true);
  assert.equal(verifyCoinbaseSignature(body, `t=${timestamp},v0=${signature}`, secret, {}, 300, (timestamp + 301) * 1000), false);
});

test('CDP JWT signs the request method, host, and path with ES256', () => {
  const { privateKey, publicKey } = generateKeyPairSync('ec', { namedCurve: 'P-256' });
  const token = createCdpJwt({ keyId: 'key-1', keySecret: privateKey.export({ type: 'pkcs8', format: 'pem' }), method: 'POST', host: 'business.coinbase.com', path: '/api/v1/checkouts' }, 1_800_000_000_000);
  const [headerText, payloadText, signatureText] = token.split('.');
  const header = JSON.parse(Buffer.from(headerText, 'base64url'));
  const payload = JSON.parse(Buffer.from(payloadText, 'base64url'));
  assert.equal(header.alg, 'ES256');
  assert.equal(payload.uri, 'POST business.coinbase.com/api/v1/checkouts');
  const valid = verify('sha256', Buffer.from(`${headerText}.${payloadText}`), { key: publicKey, dsaEncoding: 'ieee-p1363' }, Buffer.from(signatureText, 'base64url'));
  assert.equal(valid, true);
});
