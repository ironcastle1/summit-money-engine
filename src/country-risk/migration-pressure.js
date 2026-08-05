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
export function assessMigrationPressure(input = {
}) {
  const events = input.events || [];
  const displacement = Number(input.displacedShare);
  const netOutflow = Math.abs(Math.min(0,Number(input.netMigrationRate)));
  const refugees = Number(input.refugeeShare);
  const score = mean([displacement*4,netOutflow*8,refugees*4].filter(Number.isFinite));
  const evidence = input.evidence || [];
  return factor('migration', clamp(score), {
    confidence: input.confidence ?? confidenceFromEvidence(evidence), state: evidence.length || events.length || Object.keys(input).length > 1 ? (input.state || 'MEASURED') : 'UNAVAILABLE', direction: input.direction || 'STABLE', explanation: 'Displacement and migration pressure', evidence
  });
}
