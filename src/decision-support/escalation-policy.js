import { clean } from './text.js';

export const DEFAULT_ESCALATION_POLICIES = Object.freeze([
  Object.freeze({ id: 'critical-immediate', label: 'Critical immediate', minimumScore: 85, domains: [], maximumAgeMinutes: 180, channel: 'IMMEDIATE', targetRole: 'DUTY_MANAGER', acknowledgeMinutes: 10, resolveMinutes: 60 }),
  Object.freeze({ id: 'urgent-operational', label: 'Urgent operational', minimumScore: 70, domains: ['CONFLICT', 'HAZARDS', 'LOGISTICS'], maximumAgeMinutes: 360, channel: 'PRIORITY', targetRole: 'OPERATIONS', acknowledgeMinutes: 20, resolveMinutes: 180 }),
  Object.freeze({ id: 'market-opportunity', label: 'Market opportunity', minimumScore: 65, domains: ['MARKETS', 'OPPORTUNITIES'], maximumAgeMinutes: 720, channel: 'PRIORITY', targetRole: 'COMMERCIAL', acknowledgeMinutes: 30, resolveMinutes: 240 }),
  Object.freeze({ id: 'country-policy', label: 'Country policy change', minimumScore: 60, domains: ['COUNTRIES'], maximumAgeMinutes: 1440, channel: 'DIGEST', targetRole: 'ANALYST', acknowledgeMinutes: 60, resolveMinutes: 480 })
]);

export function normalizeEscalationPolicy(input = {}) {
  const domains = Array.isArray(input.domains) ? input.domains.map(value => clean(value, 40).toUpperCase()).filter(Boolean) : [];
  return Object.freeze({
    id: clean(input.id || input.label || 'policy', 120),
    label: clean(input.label || 'Escalation policy', 160),
    enabled: input.enabled !== false,
    minimumScore: Math.max(0, Math.min(100, Number(input.minimumScore ?? 70))),
    domains: Object.freeze(domains),
    maximumAgeMinutes: Math.max(1, Math.min(43_200, Number(input.maximumAgeMinutes) || 720)),
    channel: clean(input.channel || 'PRIORITY', 40).toUpperCase(),
    targetRole: clean(input.targetRole || 'ANALYST', 80).toUpperCase(),
    acknowledgeMinutes: Math.max(1, Math.min(10_080, Number(input.acknowledgeMinutes) || 30)),
    resolveMinutes: Math.max(1, Math.min(43_200, Number(input.resolveMinutes) || 240)),
    requireIndependentSources: Math.max(0, Math.min(10, Number(input.requireIndependentSources) || 0)),
    requireActionable: Boolean(input.requireActionable),
    tags: Object.freeze((input.tags || []).map(value => clean(value, 40).toLowerCase()).filter(Boolean).slice(0, 30))
  });
}

function signalAgeMinutes(signal, now) {
  const timestamp = Date.parse(signal.time || signal.updatedAt || signal.createdAt);
  if (!Number.isFinite(timestamp)) return Number.POSITIVE_INFINITY;
  return Math.max(0, (now - timestamp) / 60_000);
}

function independentSources(signal) {
  const evidence = signal.evidence || signal.sources || [];
  const groups = new Set(evidence.map(item => item.independenceGroup || item.publisher || item.source || item.id).filter(Boolean));
  return groups.size;
}

export function evaluateEscalation(signal, policies = DEFAULT_ESCALATION_POLICIES, options = {}) {
  const now = Number(options.now) || Date.now();
  const score = Number(signal.attention?.score ?? signal.priority ?? signal.score ?? 0);
  const domain = clean(signal.domain || signal.category, 40).toUpperCase();
  const tags = new Set((signal.tags || []).map(value => String(value).toLowerCase()));
  const ageMinutes = signalAgeMinutes(signal, now);
  const sourceCount = independentSources(signal);
  const actionability = Number(signal.attention?.actionability?.score ?? signal.actionability ?? 0);
  const matches = [];

  for (const rawPolicy of policies) {
    const policy = normalizeEscalationPolicy(rawPolicy);
    const reasons = [];
    if (!policy.enabled) continue;
    if (score < policy.minimumScore) continue;
    reasons.push(`score ${score.toFixed(0)} ≥ ${policy.minimumScore}`);
    if (policy.domains.length && !policy.domains.includes(domain)) continue;
    if (policy.domains.length) reasons.push(`domain ${domain}`);
    if (ageMinutes > policy.maximumAgeMinutes) continue;
    reasons.push(`age ${Math.round(ageMinutes)}m`);
    if (sourceCount < policy.requireIndependentSources) continue;
    if (policy.requireIndependentSources) reasons.push(`${sourceCount} independent sources`);
    if (policy.requireActionable && actionability < 45) continue;
    if (policy.tags.length && !policy.tags.some(tag => tags.has(tag))) continue;
    matches.push(Object.freeze({
      policyId: policy.id,
      policy: policy.label,
      signalId: String(signal.id || ''),
      channel: policy.channel,
      targetRole: policy.targetRole,
      acknowledgeMinutes: policy.acknowledgeMinutes,
      resolveMinutes: policy.resolveMinutes,
      dueAt: new Date(now + policy.acknowledgeMinutes * 60_000).toISOString(),
      score,
      reasons: Object.freeze(reasons)
    }));
  }

  matches.sort((a, b) => a.acknowledgeMinutes - b.acknowledgeMinutes || b.score - a.score);
  return Object.freeze(matches);
}

export function escalationQueue(signals = [], policies = DEFAULT_ESCALATION_POLICIES, options = {}) {
  const queue = [];
  for (const signal of signals) {
    for (const match of evaluateEscalation(signal, policies, options)) queue.push(Object.freeze({ ...match, signal }));
  }
  queue.sort((a, b) => Date.parse(a.dueAt) - Date.parse(b.dueAt) || b.score - a.score);
  return Object.freeze(queue.slice(0, Math.max(1, Math.min(1000, Number(options.limit) || 250))));
}
