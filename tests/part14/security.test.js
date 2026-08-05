import test from 'node:test';
import assert from 'node:assert/strict';
import { createShareLink, evaluateAccess, hashPasscode, redactPublication, signShareToken, verifyPasscode, verifyShareToken, watermarkRecord } from '../../src/publishing/index.js';

test('share tokens are signed and tamper evident', () => { const token = signShareToken({ id: 'x' }, 'secret'); assert.equal(verifyShareToken(token, 'secret').id, 'x'); assert.equal(verifyShareToken(`${token}x`, 'secret'), null); });
test('passcodes use a salted memory-hard digest', () => { const record = hashPasscode('correct'); assert.equal(verifyPasscode('correct', record), true); assert.equal(verifyPasscode('wrong', record), false); });
test('secure share access enforces expiry and clearance', () => { const denied = evaluateAccess({ expiresAt: '2020-01-01T00:00:00Z', clearance: 'PUBLIC', classification: 'CONFIDENTIAL' }); assert.equal(denied.allowed, false); assert.ok(denied.reasons.includes('LINK_EXPIRED')); assert.ok(denied.reasons.includes('INSUFFICIENT_CLEARANCE')); });
test('share links include bounded access controls', () => { const share = createShareLink({ editionId: 'e1', owner: 'u', passcode: '1234', maximumViews: 3 }, 'secret'); assert.ok(share.token.includes('.')); assert.equal(share.maximumViews, 3); assert.ok(share.passcode.digest); });
test('nested publication fields can be redacted', () => { const output = redactPublication({ a: { b: 1, c: 2 } }, ['a.b']); assert.deepEqual(output, { a: { c: 2 } }); });
test('recipient watermarks contain a traceable fingerprint', () => { const item = watermarkRecord({ recipient: 'reader@example.test', editionId: 'e1', issuedAt: '2026-08-04T00:00:00Z' }); assert.equal(item.fingerprint.length, 20); assert.match(item.text, /reader@example\.test/); });
