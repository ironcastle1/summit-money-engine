import { clamp, round } from './numbers.js';

const CLEARANCE_BASE_HOURS = Object.freeze({
  GREEN: 2,
  DOCUMENTARY: 8,
  PHYSICAL: 28,
  QUARANTINE: 72,
  INVESTIGATION: 168
});

export function customsClearanceEstimate(input = {}) {
  const channel = String(input.channel || 'DOCUMENTARY').toUpperCase();
  const baseHours = CLEARANCE_BASE_HOURS[channel] ?? CLEARANCE_BASE_HOURS.DOCUMENTARY;
  const documentCompleteness = clamp(Number(input.documentCompletenessPct ?? 100), 0, 100);
  const trustedTrader = Boolean(input.trustedTrader);
  const perishability = clamp(Number(input.perishability || 0), 0, 1);
  const hazardous = Boolean(input.hazardous);
  const sanctionsScreening = Boolean(input.sanctionsScreening);
  const randomInspectionRate = clamp(Number(input.randomInspectionRatePct || 0), 0, 100);
  const portCongestionScore = clamp(Number(input.portCongestionScore || 0), 0, 100);

  const documentPenalty = (100 - documentCompleteness) * 0.35;
  const congestionPenalty = (portCongestionScore / 100) ** 2 * 36;
  const inspectionPenalty = randomInspectionRate / 100 * 24;
  const hazardousPenalty = hazardous ? 14 : 0;
  const sanctionsPenalty = sanctionsScreening ? 24 : 0;
  const trustedReduction = trustedTrader ? Math.min(8, baseHours * 0.35) : 0;
  const perishabilityPriority = perishability > 0.7 ? Math.min(6, baseHours * 0.25) : 0;

  const expectedHours = Math.max(
    0.5,
    baseHours + documentPenalty + congestionPenalty + inspectionPenalty + hazardousPenalty + sanctionsPenalty - trustedReduction - perishabilityPriority
  );

  const uncertaintyHours = expectedHours * (0.15 + randomInspectionRate / 200);

  return Object.freeze({
    channel,
    expectedHours: round(expectedHours, 1),
    uncertaintyHours: round(uncertaintyHours, 1),
    components: Object.freeze({
      baseHours,
      documentPenalty: round(documentPenalty, 1),
      congestionPenalty: round(congestionPenalty, 1),
      inspectionPenalty: round(inspectionPenalty, 1),
      hazardousPenalty,
      sanctionsPenalty,
      trustedReduction: round(trustedReduction, 1),
      perishabilityPriority: round(perishabilityPriority, 1)
    })
  });
}

export function customsChannels() {
  return Object.entries(CLEARANCE_BASE_HOURS).map(([id, baseHours]) => Object.freeze({ id, baseHours }));
}
