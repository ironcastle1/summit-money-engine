import { clamp, round } from '../../core/numbers.js';

export function exponentialDecay(ageMs, halfLifeMs) {
  if (!Number.isFinite(ageMs) || !Number.isFinite(halfLifeMs) || halfLifeMs <= 0) return 0;
  if (ageMs <= 0) return 1;
  return Math.exp(-Math.log(2) * ageMs / halfLifeMs);
}

export function decayedScore(score, ageMs, halfLifeMs) {
  if (!Number.isFinite(score)) return null;
  return round(clamp(score * exponentialDecay(ageMs, halfLifeMs), 0, 100), 1);
}

export function halfLifeForKind(kind, severity = 50) {
  const normalized = String(kind || '').toUpperCase();
  const severityFactor = clamp((Number(severity) || 50) / 50, 0.5, 2);
  const baseHours = normalized === 'MARKET' ? 8 : normalized === 'PREDICTION' ? 48 : normalized === 'EVENT' ? 24 : 18;
  return Math.round(baseHours * severityFactor * 60 * 60 * 1000);
}

export function expiryForOpportunity(opportunity, now = Date.now()) {
  const createdAt = Date.parse(opportunity?.generatedAt || opportunity?.observedAt || '') || now;
  const halfLifeMs = halfLifeForKind(opportunity?.kind, opportunity?.severity || opportunity?.score || 50);
  const expiryMs = createdAt + halfLifeMs * 4;
  return {
    halfLifeMs,
    expiresAt: new Date(expiryMs).toISOString(),
    ageMs: Math.max(0, now - createdAt),
    decayFactor: round(exponentialDecay(Math.max(0, now - createdAt), halfLifeMs), 4)
  };
}
