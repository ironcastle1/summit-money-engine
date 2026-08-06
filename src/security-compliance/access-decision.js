import { evaluatePermission } from './permission-evaluator.js';
import { evaluateAttributes } from './attribute-policy.js';
import { assertTenantBoundary } from './tenant-isolation.js';
import { intersectsScope, resourceScope } from './resource-scope.js';
import { sessionRisk } from './session-risk.js';

export function accessDecision(input = {}) {
  const subject = input.subject || {};
  const resource = input.resource || {};
  const permission = evaluatePermission({ ...subject, permission: input.permission });
  const tenant = assertTenantBoundary(subject, resource);
  const scope = resourceScope(resource);
  const attributes = evaluateAttributes({ ...subject, ...input.context, resourceTenantId: scope.tenantId, classification: scope.classification });
  const scopeAllowed = intersectsScope(subject, scope);
  const risk = sessionRisk(input.context || {});
  const reasons = [];
  if (!permission.allowed) reasons.push(permission.reason);
  if (!tenant.allowed) reasons.push(tenant.reason);
  if (!scopeAllowed) reasons.push('RESOURCE_SCOPE_MISMATCH');
  reasons.push(...attributes.reasons);
  if (risk.score >= 80) reasons.push('SESSION_RISK_CRITICAL');
  const stepUp = reasons.length === 0 && risk.score >= 45 && !input.context?.mfaSatisfied;
  return Object.freeze({
    decision: reasons.length ? 'DENY' : stepUp ? 'STEP_UP' : 'ALLOW',
    allowed: reasons.length === 0 && !stepUp,
    reasons: Object.freeze(reasons),
    permission,
    tenant,
    scope,
    attributes,
    sessionRisk: risk
  });
}
