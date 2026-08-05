import { clamp } from './numbers.js';

export function countryCode(value) {
  const code = String(value || '').trim().toUpperCase();
  if (!/^[A-Z]{2,3}$/.test(code)) {
    throw new TypeError('A valid ISO country code is required');
  }
  return code;
}

export function normalizedLimit(value, fallback = 250, maximum = 500) {
  const number = Number.parseInt(value, 10);
  return Math.max(1, Math.min(maximum, Number.isFinite(number) ? number : fallback));
}

export function normalizedRiskRequest(input = {}) {
  return Object.freeze({
    query: String(input.query || '').trim().slice(0, 160),
    region: String(input.region || '').trim().slice(0, 100),
    minimumRisk: clamp(input.minimumRisk || 0),
    maximumRisk: clamp(input.maximumRisk ?? 100),
    includeNews: input.includeNews !== false,
    limit: normalizedLimit(input.limit, 250, 500),
    hours: Math.max(24, Math.min(720, Number(input.hours) || 168)),
    force: input.force === true
  });
}

export function normalizedScenario(input = {}) {
  return Object.freeze({
    countryId: String(input.countryId || input.iso2 || '').trim(),
    type: String(input.type || 'POLICY_SHOCK').toUpperCase(),
    severity: clamp(input.severity ?? 50),
    horizonDays: Math.max(1, Math.min(730, Number(input.horizonDays) || 90)),
    assumptions: Object.freeze({ ...(input.assumptions || {}) })
  });
}
