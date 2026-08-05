import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ApprovalWorkflowStore,
  BriefingScheduleStore,
  DecisionAuditTrail,
  distributionPolicy,
  evaluateDistribution,
  evaluateEscalation,
  redactForDistribution,
  SlaTracker
} from '../../src/decision-support/index.js';
import { DecisionSupportPlatformService } from '../../src/services/decision-support-platform-service.js';
import { fixtureSignals } from './fixtures.js';

test('escalation policies convert critical signals into operational deadlines', () => {
  const signal = { ...fixtureSignals()[0], attention: { score: 91, actionability: { score: 80 } } };
  const matches = evaluateEscalation(signal, [{ id: 'critical', label: 'Critical', minimumScore: 85, domains: ['CONFLICT'], acknowledgeMinutes: 10, resolveMinutes: 60 }]);
  assert.equal(matches.length, 1);
  assert.equal(matches[0].targetRole, 'ANALYST');
  assert.equal(matches[0].acknowledgeMinutes, 10);
  assert.match(matches[0].reasons.join(' '), /score 91/);
});

test('SLA tracker marks acknowledgement and resolution breaches independently', async () => {
  const tracker = new SlaTracker();
  const created = await tracker.create('owner', { id: 'sla-1', signalId: 'signal-1', createdAt: '2026-08-04T10:00:00Z', acknowledgeMinutes: 10, resolveMinutes: 60 });
  assert.equal(created.health, 'BREACHED');
  const acknowledged = await tracker.transition('owner', 'sla-1', 'ACKNOWLEDGED', { acknowledgedAt: '2026-08-04T10:05:00Z' });
  assert.equal(acknowledged.state, 'ACKNOWLEDGED');
  const resolved = await tracker.transition('owner', 'sla-1', 'RESOLVED');
  assert.equal(resolved.health, 'CLOSED');
  const summary = await tracker.summary('owner');
  assert.equal(summary.closed, 1);
});

test('briefing schedules are timezone aware and do not run twice in one minute', async () => {
  const schedules = new BriefingScheduleStore();
  const item = await schedules.put('owner', { id: 'morning', name: 'Morning', time: '08:30', days: ['TUE'], timezone: 'UTC' });
  const now = new Date('2026-08-04T08:30:00Z');
  assert.equal((await schedules.due('owner', now)).length, 1);
  await schedules.markRun('owner', item.id, now);
  assert.equal((await schedules.due('owner', new Date('2026-08-04T08:30:30Z'))).length, 0);
});

test('approval workflows enforce valid state transitions and retain history', async () => {
  const approvals = new ApprovalWorkflowStore();
  const draft = await approvals.create('owner', { id: 'approval-1', resourceType: 'REPORT', resourceId: 'report-1', title: 'Publish report' });
  assert.equal(draft.state, 'DRAFT');
  const submitted = await approvals.transition('owner', draft.id, 'SUBMITTED', { actor: 'analyst' });
  const approved = await approvals.transition('owner', submitted.id, 'APPROVED', { actor: 'manager', note: 'Evidence checked' });
  assert.equal(approved.state, 'APPROVED');
  assert.equal(approved.history.length, 2);
  await assert.rejects(() => approvals.transition('owner', approved.id, 'DRAFT'), /not allowed/);
});

test('distribution controls block external recipients and require approval', () => {
  const policy = distributionPolicy({ classification: 'CONFIDENTIAL', allowExternal: false, requireApproval: true, allowedRoles: ['ANALYST'] });
  const blocked = evaluateDistribution({ policy, actorRoles: ['ANALYST'], recipients: ['outside@example.net'], organisationDomains: ['merlin.local'], approvalState: 'DRAFT' });
  assert.equal(blocked.allowed, false);
  assert.ok(blocked.reasons.some(reason => reason.includes('outside policy')));
  assert.ok(blocked.reasons.some(reason => reason.includes('Approved')));
  const allowed = evaluateDistribution({ policy, actorRoles: ['ANALYST'], recipients: ['user@merlin.local'], organisationDomains: ['merlin.local'], approvalState: 'APPROVED' });
  assert.equal(allowed.allowed, true);
});

test('distribution redaction handles nested field paths', () => {
  const redacted = redactForDistribution({ title: 'Brief', owner: { email: 'secret@example.com', name: 'Analyst' }, token: 'hidden' }, ['owner.email', 'token']);
  assert.equal(redacted.owner.email, '[REDACTED]');
  assert.equal(redacted.token, '[REDACTED]');
  assert.equal(redacted.owner.name, 'Analyst');
});

test('audit trail forms a verifiable hash chain', async () => {
  const audit = new DecisionAuditTrail();
  await audit.append('owner', { action: 'CREATED', resourceType: 'CASE', resourceId: 'case-1', actor: 'analyst' });
  await audit.append('owner', { action: 'UPDATED', resourceType: 'CASE', resourceId: 'case-1', actor: 'manager', changes: { status: 'MONITORING' } });
  const entries = await audit.list('owner');
  assert.equal(entries.length, 2);
  assert.equal(entries[0].previousHash, entries[1].hash);
  assert.deepEqual(await audit.verify('owner'), { valid: true, entries: 2, failures: [] });
});

test('platform snapshot creates escalation SLA records and operational summaries', async () => {
  const platform = new DecisionSupportPlatformService({ escalationPolicies: [{ id: 'all', label: 'All material', minimumScore: 40, domains: [], acknowledgeMinutes: 15, resolveMinutes: 120 }] });
  const snapshot = await platform.snapshot({
    owner: 'enterprise-test',
    bundle: {
      events: { events: [{ id: 'event-1', category: 'conflict', title: 'Strategic port corridor disrupted', summary: 'Multiple verified strikes affect route access.', severity: 92, confidence: 90, source: 'Test source', time: new Date().toISOString(), location: { lat: 12, lon: 44 } }] },
      conflict: { theatres: [] },
      hazards: { events: [] },
      markets: { opportunities: [] },
      countries: { profiles: [] },
      logistics: { routes: [] },
      opportunities: { opportunities: [] }
    }
  });
  assert.equal(snapshot.signals.length, 1);
  assert.ok(snapshot.escalations.length >= 1);
  assert.ok(snapshot.slas.length >= 1);
  assert.equal(typeof snapshot.operations.slas.compliancePercent, 'number');
});
