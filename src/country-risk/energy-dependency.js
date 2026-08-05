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
export function assessEnergyDependency(input = {
}) {
  const events = input.events || [];
  const importShare = Number(input.energyImportShare);
  const supplierConcentration = Number(input.energySupplierConcentration);
  const score = mean([importShare,supplierConcentration].filter(Number.isFinite));
  const evidence = input.evidence || [];
  return factor('energy', clamp(score), {
    confidence: input.confidence ?? confidenceFromEvidence(evidence), state: evidence.length || events.length || Object.keys(input).length > 1 ? (input.state || 'MEASURED') : 'UNAVAILABLE', direction: input.direction || 'STABLE', explanation: 'Imported-energy and supplier concentration risk', evidence
  });
}
