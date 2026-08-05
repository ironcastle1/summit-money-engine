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
export function assessSecuritySectorRisk(input = {
}) {
  const events = input.events || [];
  const coup = Number(input.coupRisk);
  const factionalism = Number(input.securityFactionalism);
  const impunity = Number(input.securityImpunity);
  const score = mean([coup,factionalism,impunity].filter(Number.isFinite));
  const evidence = input.evidence || [];
  return factor('securitySector', clamp(score), {
    confidence: input.confidence ?? confidenceFromEvidence(evidence), state: evidence.length || events.length || Object.keys(input).length > 1 ? (input.state || 'MEASURED') : 'UNAVAILABLE', direction: input.direction || 'STABLE', explanation: 'Security-sector cohesion and coup risk', evidence
  });
}
