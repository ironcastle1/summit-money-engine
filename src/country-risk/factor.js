import {
  clamp,
  round
}
from './numbers.js';
export function factor(id, score, options = {
}) {
  const confidence = clamp(options.confidence ?? 0);
  const evidence = Object.freeze((options.evidence || []).slice(0, 30));
  return Object.freeze({
    id, score: round(clamp(score), 1), confidence: round(confidence, 1), state: options.state || (evidence.length ? 'MEASURED' : 'UNAVAILABLE'), direction: options.direction || 'STABLE', explanation: String(options.explanation || ''), evidence
  });
}
export function unavailableFactor(id, explanation = 'No current source is available') {
  return factor(id, 0, {
    confidence: 0, state: 'UNAVAILABLE', explanation
  });
}
export function confidenceFromEvidence(evidence = [], base = 15) {
  const independent = new Set(evidence.map(item => item.sourceId || item.source || item.publisher).filter(Boolean)).size;
  return clamp(base + evidence.length * 5 + independent * 8);
}
