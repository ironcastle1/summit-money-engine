import { addDays, iso, toDate } from './time.js';

const DAYS = Object.freeze({ CRITICAL: 7, HIGH: 30, MEDIUM: 90, LOW: 180 });

export function remediationSla(vulnerability = {}, now = Date.now()) {
  const severity = String(vulnerability.severity || 'MEDIUM').toUpperCase();
  const discovered = toDate(vulnerability.discoveredAt, new Date(now));
  const days = vulnerability.knownExploited ? Math.min(3, DAYS[severity] || 90) : DAYS[severity] || 90;
  const dueAt = vulnerability.dueAt ? toDate(vulnerability.dueAt, addDays(discovered, days)) : addDays(discovered, days);
  const remainingDays = (dueAt.getTime() - Number(now)) / 86400000;
  return Object.freeze({
    vulnerabilityId: vulnerability.id,
    targetDays: days,
    dueAt: iso(dueAt),
    remainingDays: Math.round(remainingDays * 10) / 10,
    state: vulnerability.state === 'CLOSED' ? 'MET' : remainingDays < 0 ? 'BREACHED' : remainingDays <= 7 ? 'DUE_SOON' : 'OPEN'
  });
}
