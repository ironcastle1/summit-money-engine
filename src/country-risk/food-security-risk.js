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
export function assessFoodSecurityRisk(input = {
}) {
  const events = input.events || [];
  const undernourishment = Number(input.undernourishment);
  const inflation = Number(input.foodInflation);
  const importDependency = Number(input.foodImportDependency);
  const score = mean([undernourishment*3,inflation*2,importDependency].filter(Number.isFinite));
  const evidence = input.evidence || [];
  return factor('foodSecurity', clamp(score), {
    confidence: input.confidence ?? confidenceFromEvidence(evidence), state: evidence.length || events.length || Object.keys(input).length > 1 ? (input.state || 'MEASURED') : 'UNAVAILABLE', direction: input.direction || 'STABLE', explanation: 'Food affordability and import dependency', evidence
  });
}
