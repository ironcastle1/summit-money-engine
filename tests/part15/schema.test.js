import test from 'node:test';
import assert from 'node:assert/strict';
import { tenantRecord, seatRecord, invitationRecord, supportCaseRecord, statusIncidentRecord, featureFlagRecord, feedbackRecord } from '../../src/commercial-operations/index.js';
import { tenantFixture, supportFixture } from './fixtures.js';
test('tenant schema preserves commercial state and plan', () => { const item = tenantRecord(tenantFixture()); assert.equal(item.state, 'ACTIVE'); assert.equal(item.planId, 'TEAM'); });
test('seat roles are validated', () => { assert.equal(seatRecord({ tenantId: 't', email: 'a@example.test', role: 'ANALYST' }).role, 'ANALYST'); assert.throws(() => seatRecord({ role: 'ROOT' }), /Unsupported seat role/); });
test('invitations receive secure bounded tokens and expiry', () => { const item = invitationRecord({ tenantId: 't', email: 'a@example.test' }); assert.ok(item.token.length > 10); assert.ok(new Date(item.expiresAt) > new Date(item.createdAt)); });
test('support and incident states are normalized', () => { assert.equal(supportCaseRecord(supportFixture()).severity, 'SEV2'); assert.equal(statusIncidentRecord({ title: 'Incident' }).state, 'INVESTIGATING'); });
test('feature and feedback types are validated', () => { assert.equal(featureFlagRecord({ key: 'new map', rollout: 'PERCENTAGE', percentage: 25 }).key, 'NEW_MAP'); assert.equal(feedbackRecord({ type: 'NPS', score: 9 }).score, 9); });
