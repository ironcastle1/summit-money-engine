import {
  factor,
  confidenceFromEvidence
}
from './factor.js';
import {
  clamp,
  mean
}
from './numbers.js';
export function assessRegulatoryRisk(input = {
}) {
  const events = input.events || [];
  const quality = Number(input.regulatoryQuality);
  const changes = Number(input.regulatoryChanges90d);
  const score = mean([Number.isFinite(quality)?100-(quality<=2.5&&quality>=-2.5?(quality+2.5)*20:quality):null, Number.isFinite(changes)?Math.min(100,changes*8):null].filter(Number.isFinite));
  const evidence = input.evidence || [];
  return factor('regulatory', clamp(score), {
    confidence: input.confidence ?? confidenceFromEvidence(evidence), state: evidence.length || events.length || Object.keys(input).length > 1 ? (input.state || 'MEASURED') : 'UNAVAILABLE', direction: input.direction || 'STABLE', explanation: 'Regulatory quality and change intensity', evidence
  });
}
