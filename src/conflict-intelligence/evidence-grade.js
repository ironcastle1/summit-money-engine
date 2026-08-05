import {
  clamp,
  round
}
from './numbers.js';
export function evidenceGrade(input = {
}) {
  const sources = Math.max(0,
  Number(input.independentSources) || 0),
  freshness = clamp(input.freshness ?? 70),
  quality = clamp(input.quality ?? 60),
  agreement = clamp(input.agreement ?? 70),
  score = clamp(quality * .34 + freshness * .22 + agreement * .22 + Math.min(100,
  sources * 22) * .22);
  return Object.freeze({
    score: round(score,
    1),
    grade: score >= 85 ? 'A' : score >= 70 ? 'B' : score >= 55 ? 'C' : score >= 40 ? 'D' : 'E',
    independentSources: sources
  });
}
