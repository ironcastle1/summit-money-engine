import { securityId } from './ids.js';
import { riskScore } from './risk-score.js';
import { iso } from './time.js';
import { clean, unique } from './utilities.js';

export function riskRecord(input = {}) {
  const scoring = riskScore(input);
  return Object.freeze({
    id: input.id || securityId('risk', input.title),
    tenantId: clean(input.tenantId, 190),
    title: clean(input.title, 300),
    description: clean(input.description, 2000),
    category: clean(input.category || 'SECURITY', 80).toUpperCase(),
    state: clean(input.state || 'OPEN', 40).toUpperCase(),
    ownerId: clean(input.ownerId, 190),
    affectedAssets: Object.freeze(unique(input.affectedAssets || [])),
    treatment: clean(input.treatment, 1500),
    targetDate: input.targetDate ? iso(input.targetDate) : null,
    ...scoring,
    createdAt: iso(input.createdAt),
    updatedAt: iso()
  });
}
