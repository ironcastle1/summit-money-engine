import { clamp, mean, round } from '../../core/numbers.js';
import { jaccardSimilarity, tokenSet } from './text.js';

const OPPOSITES = Object.freeze({ UP: 'DOWN', DOWN: 'UP', HALT: 'RESUME', RESUME: 'HALT', CONFIRM: 'DENY', DENY: 'CONFIRM' });

function comparable(left, right) {
  if (left.articleId === right.articleId) return false;
  if (left.metric !== right.metric && !['GENERAL', left.metric, right.metric].includes('GENERAL')) return false;
  return jaccardSimilarity(tokenSet(left.subject), tokenSet(right.subject)) >= 0.25 || jaccardSimilarity(tokenSet(left.sentence), tokenSet(right.sentence)) >= 0.35;
}

function numericConflict(left, right) {
  const a = left.values?.[0]?.value;
  const b = right.values?.[0]?.value;
  if (!Number.isFinite(a) || !Number.isFinite(b) || a === 0 || b === 0) return null;
  const ratio = Math.max(Math.abs(a), Math.abs(b)) / Math.min(Math.abs(a), Math.abs(b));
  return { conflict: ratio >= 1.8, ratio: round(ratio, 2), left: a, right: b };
}

function directionalConflict(left, right) {
  if (!OPPOSITES[left.direction]) return false;
  return OPPOSITES[left.direction] === right.direction;
}

export function analyseClaimAgreement(claims) {
  const comparisons = [];
  for (let left = 0; left < claims.length; left += 1) {
    for (let right = left + 1; right < claims.length; right += 1) {
      if (!comparable(claims[left], claims[right])) continue;
      const numeric = numericConflict(claims[left], claims[right]);
      const directionConflict = directionalConflict(claims[left], claims[right]);
      const conflict = Boolean(directionConflict || numeric?.conflict);
      comparisons.push({
        leftClaimId: claims[left].id,
        rightClaimId: claims[right].id,
        conflict,
        type: directionConflict ? 'DIRECTION' : numeric?.conflict ? 'NUMERIC' : 'AGREEMENT',
        numericRatio: numeric?.ratio || null,
        leftSource: claims[left].sourceDomain,
        rightSource: claims[right].sourceDomain,
        subject: claims[left].subject,
        metric: claims[left].metric
      });
    }
  }
  const conflicts = comparisons.filter(item => item.conflict);
  const compared = comparisons.length;
  const agreementRatio = compared ? 1 - conflicts.length / compared : null;
  const independentSources = new Set(claims.map(claim => claim.sourceDomain).filter(Boolean)).size;
  const averageClaimConfidence = claims.length ? mean(claims.map(claim => claim.confidence)) : null;
  const score = agreementRatio === null ? null : round(clamp(agreementRatio * 75 + Math.min(15, independentSources * 3) + (averageClaimConfidence || 0) * 0.1, 0, 100));
  return Object.freeze({
    claimCount: claims.length,
    comparisonCount: compared,
    conflictCount: conflicts.length,
    agreementPct: agreementRatio === null ? null : round(agreementRatio * 100),
    score,
    independentSources,
    conflicts: Object.freeze(conflicts.slice(0, 30)),
    comparisons: Object.freeze(comparisons.slice(0, 100))
  });
}
