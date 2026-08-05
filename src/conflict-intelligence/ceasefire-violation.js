import {
  round
}
from './numbers.js';
export function assessCeasefireViolations(status) {
  const violations = status?.violations || [],
  severity = violations.reduce((sum,
  event) => sum + Number(event.severity || 0),
  0),
  score = Math.min(100,
  violations.length * 18 + severity * .25);
  return Object.freeze({
    score: round(score,
    1),
    count: violations.length,
    material: violations.some(event => event.fatalities > 0 || event.crossBorder || event.severity >= 70),
    latest: violations[0] || null
  });
}
