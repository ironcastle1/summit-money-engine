import { regionById } from './residency-catalog.js';

export function residencyDecision(input = {}) {
  const source = regionById(input.sourceRegion);
  const target = regionById(input.targetRegion);
  if (!source || !target) return Object.freeze({ allowed: false, reason: 'UNKNOWN_REGION', safeguards: [] });
  if (source.id === target.id) return Object.freeze({ allowed: true, reason: 'SAME_REGION', safeguards: [] });
  const adequate = source.adequacy.includes(target.id) || target.adequacy.includes(source.id);
  const safeguards = adequate ? [] : ['TRANSFER_RISK_ASSESSMENT', 'STANDARD_CONTRACTUAL_CLAUSES', 'ENCRYPTION', 'DATA_MINIMISATION'];
  const restricted = input.classification === 'RESTRICTED' && !adequate && !input.approvedException;
  return Object.freeze({ allowed: !restricted, reason: restricted ? 'RESTRICTED_TRANSFER_BLOCKED' : adequate ? 'ADEQUACY' : 'SAFEGUARDS_REQUIRED', safeguards: Object.freeze(safeguards) });
}
