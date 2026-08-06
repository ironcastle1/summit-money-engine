export function incidentSeverity(input = {}) {
  const confidentiality = Number(input.confidentialityImpact || 0);
  const integrity = Number(input.integrityImpact || 0);
  const availability = Number(input.availabilityImpact || 0);
  const users = Number(input.affectedUsers || 0);
  const regulated = Boolean(input.regulatedData);
  const activeThreat = Boolean(input.activeThreat);
  const score = Math.min(100, Math.max(confidentiality, integrity, availability) * 0.55 + Math.min(30, Math.log10(users + 1) * 12) + (regulated ? 15 : 0) + (activeThreat ? 15 : 0));
  const severity = score >= 80 ? 'SEV1' : score >= 60 ? 'SEV2' : score >= 35 ? 'SEV3' : 'SEV4';
  return Object.freeze({ score: Math.round(score), severity });
}
