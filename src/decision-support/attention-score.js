import { weightedMean, round, clamp } from './numbers.js';
import { urgencyScore } from './urgency-score.js';
import { importanceScore } from './importance-score.js';
import { confidenceScore } from './confidence-score.js';
import { actionabilityScore } from './actionability-score.js';
import { priority } from './priority.js';
export function attentionScore(signal, now = Date.now()) {
  const urgency = urgencyScore(signal, now);
  const importance = importanceScore(signal);
  const confidence = confidenceScore(signal);
  const actionability = actionabilityScore(signal);
  const score = weightedMean([
    { value: urgency.score, weight: 0.3 },
    { value: importance.score, weight: 0.3 },
    { value: confidence.score, weight: 0.2 },
    { value: actionability.score, weight: 0.2 }
  ]);
  const reasons = [urgency.band, importance.domainWeight >= 0.9 ? 'HIGH_IMPACT_DOMAIN' : null, confidence.band === 'HIGH' ? 'HIGH_CONFIDENCE' : null, ...actionability.reasons].filter(Boolean);
  return Object.freeze({ ...priority(round(clamp(score), 1), reasons), urgency, importance, confidence, actionability });
}
