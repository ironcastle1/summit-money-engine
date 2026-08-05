const WEIGHTS = Object.freeze({
  browser: 18,
  responsive: 12,
  accessibility: 16,
  performance: 14,
  journeys: 18,
  reliability: 12,
  security: 10
});

function normalizeScore(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return null;
  return Math.max(0, Math.min(100, number));
}

export function calculateReadinessScore(sections = {}) {
  let earned = 0;
  let available = 0;
  const details = [];
  for (const [section, weight] of Object.entries(WEIGHTS)) {
    const score = normalizeScore(sections[section]?.score ?? sections[section]);
    if (score === null) {
      details.push(Object.freeze({ section, weight, score: null, status: 'NOT_MEASURED' }));
      continue;
    }
    earned += weight * (score / 100);
    available += weight;
    details.push(Object.freeze({ section, weight, score, status: score >= 90 ? 'PASS' : score >= 75 ? 'WARN' : 'FAIL' }));
  }
  const score = available ? Math.round((earned / available) * 100) : 0;
  return Object.freeze({
    score,
    status: available === 0 ? 'NOT_MEASURED' : score >= 90 ? 'READY' : score >= 75 ? 'CONDITIONAL' : 'NOT_READY',
    measuredWeight: available,
    details
  });
}
