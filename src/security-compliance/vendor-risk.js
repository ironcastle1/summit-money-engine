import { securityId } from './ids.js';
import { iso } from './time.js';
import { clamp, clean, unique } from './utilities.js';

export function vendorRiskRecord(input = {}) {
  const inherent = clamp(input.inherentRisk ?? 50);
  const controlStrength = clamp(input.controlStrength ?? 50);
  const residual = clamp(inherent * (1 - controlStrength / 130));
  return Object.freeze({
    id: input.id || securityId('vendor', input.name),
    tenantId: clean(input.tenantId, 190),
    name: clean(input.name, 240),
    service: clean(input.service, 300),
    criticality: clean(input.criticality || 'MEDIUM', 40).toUpperCase(),
    dataCategories: Object.freeze(unique(input.dataCategories || [])),
    regions: Object.freeze(unique(input.regions || [])),
    subprocessors: Object.freeze(unique(input.subprocessors || [])),
    certifications: Object.freeze(unique(input.certifications || [])),
    signedAt: input.signedAt ? iso(input.signedAt) : null,
    transferMechanism: clean(input.transferMechanism, 100).toUpperCase() || null,
    inherentRisk: inherent,
    controlStrength,
    residualRisk: Math.round(residual),
    state: clean(input.state || 'ACTIVE', 40).toUpperCase(),
    reviewDueAt: input.reviewDueAt ? iso(input.reviewDueAt) : null,
    createdAt: iso(input.createdAt),
    updatedAt: iso()
  });
}
