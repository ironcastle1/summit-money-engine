import { clamp, round } from '../../core/numbers.js';

function daysUntil(dateText, now = Date.now()) {
  const timestamp = Date.parse(`${dateText}T00:00:00Z`);
  return Number.isFinite(timestamp) ? Math.ceil((timestamp - now) / 86_400_000) : null;
}

export function analyseElections(payload, options = {}) {
  const records = Array.isArray(payload?.elections) ? payload.elections : [];
  const countryCode = String(options.countryCode || '').toUpperCase();
  const matching = records.filter(item => {
    const division = String(item.ocdDivisionId || '').toLowerCase();
    if (!countryCode) return true;
    if (countryCode === 'US') return division.includes('country:us') || !division;
    return division.includes(`country:${countryCode.toLowerCase()}`);
  }).map(item => ({ ...item, daysUntil: daysUntil(item.electionDay, options.now) })).filter(item => item.daysUntil === null || item.daysUntil >= -7).sort((a, b) => (a.daysUntil ?? 99999) - (b.daysUntil ?? 99999));
  const next = matching[0] || null;
  const proximityScore = !next || next.daysUntil === null || next.daysUntil < 0 ? 0 : round(clamp(100 * Math.exp(-next.daysUntil / 60), 0, 100), 1);
  return Object.freeze({ available: records.length > 0, count: matching.length, next, proximityScore, elections: matching.slice(0, 30) });
}
