import { securityId } from './ids.js';
import { iso } from './time.js';
import { clamp, clean, unique } from './utilities.js';

export function controlAssessment(input = {}) {
  const design = clamp(input.designScore ?? 0);
  const operation = clamp(input.operationScore ?? 0);
  const evidence = clamp(input.evidenceScore ?? 0);
  const score = Math.round(design * 0.35 + operation * 0.45 + evidence * 0.20);
  const state = input.notApplicable ? 'NOT_APPLICABLE' : score >= 85 ? 'IMPLEMENTED' : score >= 45 ? 'PARTIAL' : score > 0 ? 'INEFFECTIVE' : 'NOT_ASSESSED';
  return Object.freeze({
    id: input.id || securityId('assessment', input.controlId),
    tenantId: clean(input.tenantId, 190),
    controlId: clean(input.controlId, 100).toUpperCase(),
    frameworkIds: Object.freeze(unique(input.frameworkIds || [])),
    state,
    designScore: design,
    operationScore: operation,
    evidenceScore: evidence,
    score,
    evidenceIds: Object.freeze(unique(input.evidenceIds || [])),
    findings: Object.freeze(unique(input.findings || [])),
    assessorId: clean(input.assessorId, 190),
    assessedAt: iso(input.assessedAt),
    nextReviewAt: input.nextReviewAt ? iso(input.nextReviewAt) : null,
    updatedAt: iso()
  });
}
