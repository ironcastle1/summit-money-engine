import {
  clamp,
  round
}
from './numbers.js';
export function manipulationRisk(events = [],
contradictions = {
}) {
  const anonymous = events.filter(event => /unknown|social|telegram|unverified/i.test(event.evidence?.source || '')).length,
  lowAgreement = events.filter(event => Number(event.evidence?.agreement || 0) < 45).length,
  score = clamp((anonymous / events.length || 0) * 35 + (lowAgreement / events.length || 0) * 35 + Math.min(30,
  (contradictions.count || 0) * 10));
  return Object.freeze({
    score: round(score,
    1),
    band: score >= 70 ? 'HIGH' : score >= 40 ? 'ELEVATED' : 'LOW',
    anonymous,
    lowAgreement,
    contradictions: contradictions.count || 0
  });
}
