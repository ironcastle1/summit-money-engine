import { clean } from './text.js';

export const CLASSIFICATIONS = Object.freeze(['PUBLIC', 'INTERNAL', 'CONFIDENTIAL', 'RESTRICTED']);

const RANK = Object.freeze({ PUBLIC: 0, INTERNAL: 1, CONFIDENTIAL: 2, RESTRICTED: 3 });

export function distributionPolicy(input = {}) {
  const classification = CLASSIFICATIONS.includes(String(input.classification).toUpperCase()) ? String(input.classification).toUpperCase() : 'INTERNAL';
  return Object.freeze({
    id: clean(input.id || `${classification.toLowerCase()}-default`, 120),
    label: clean(input.label || `${classification} distribution`, 160),
    classification,
    allowedRoles: Object.freeze((input.allowedRoles || []).map(value => clean(value, 80).toUpperCase()).filter(Boolean)),
    allowedDomains: Object.freeze((input.allowedDomains || []).map(value => clean(value, 120).toLowerCase()).filter(Boolean)),
    allowExternal: classification === 'PUBLIC' ? true : Boolean(input.allowExternal),
    requireApproval: classification === 'PUBLIC' ? Boolean(input.requireApproval) : input.requireApproval !== false,
    watermark: input.watermark !== false,
    expiresHours: Math.max(0, Math.min(8760, Number(input.expiresHours) || 0)),
    redactFields: Object.freeze((input.redactFields || []).map(value => clean(value, 120)).filter(Boolean)),
    maximumRecipients: Math.max(1, Math.min(1000, Number(input.maximumRecipients) || 100))
  });
}

function domainOf(address) {
  const text = String(address || '').trim().toLowerCase();
  const at = text.lastIndexOf('@');
  return at >= 0 ? text.slice(at + 1) : '';
}

export function evaluateDistribution(input = {}) {
  const policy = distributionPolicy(input.policy || input);
  const recipients = [...new Set((input.recipients || []).map(value => String(value).trim().toLowerCase()).filter(Boolean))];
  const actorRoles = new Set((input.actorRoles || []).map(value => String(value).toUpperCase()));
  const organisationDomains = new Set((input.organisationDomains || []).map(value => String(value).toLowerCase()));
  const reasons = [];
  const blocked = [];

  if (recipients.length > policy.maximumRecipients) reasons.push(`Recipient limit ${policy.maximumRecipients} exceeded`);
  if (policy.allowedRoles.length && !policy.allowedRoles.some(role => actorRoles.has(role))) reasons.push('Actor does not hold an allowed distribution role');

  for (const recipient of recipients) {
    const domain = domainOf(recipient);
    const internal = domain && organisationDomains.has(domain);
    const allowedDomain = !policy.allowedDomains.length || policy.allowedDomains.includes(domain);
    if ((!policy.allowExternal && !internal) || !allowedDomain) blocked.push(recipient);
  }

  if (blocked.length) reasons.push(`${blocked.length} recipients are outside policy`);
  if (policy.requireApproval && input.approvalState !== 'APPROVED') reasons.push('Approved distribution record is required');
  if (input.contentClassification && RANK[String(input.contentClassification).toUpperCase()] > RANK[policy.classification]) reasons.push('Policy classification is lower than content classification');

  return Object.freeze({
    allowed: reasons.length === 0,
    policy,
    recipients: Object.freeze(recipients),
    blockedRecipients: Object.freeze(blocked),
    reasons: Object.freeze(reasons),
    controls: Object.freeze({ watermark: policy.watermark, expiresAt: policy.expiresHours ? new Date(Date.now() + policy.expiresHours * 3_600_000).toISOString() : null, redactFields: policy.redactFields })
  });
}

export function redactForDistribution(value, fields = []) {
  const denied = new Set(fields.map(String));
  function visit(item, path = '') {
    if (Array.isArray(item)) return item.map((entry, index) => visit(entry, `${path}[${index}]`));
    if (item && typeof item === 'object') {
      const output = {};
      for (const [key, child] of Object.entries(item)) {
        const nextPath = path ? `${path}.${key}` : key;
        output[key] = denied.has(key) || denied.has(nextPath) ? '[REDACTED]' : visit(child, nextPath);
      }
      return output;
    }
    return item;
  }
  return Object.freeze(visit(value));
}
