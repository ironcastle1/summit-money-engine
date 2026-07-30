import { buildEntitlements, hasFeature, withinLimit } from '../domain/accounts/entitlements.js';
import { ForbiddenError } from '../core/errors.js';
export class EntitlementService {
  constructor(options) { Object.assign(this, options); }
  async forUser(user) { const [subscription, usage] = await Promise.all([this.subscriptions.findByUserId(user.id), this.usage.get(user.id)]); return buildEntitlements(user, subscription, usage); }
  async requireFeature(user, feature) { const entitlements = await this.forUser(user); if (!hasFeature(entitlements, feature)) throw new ForbiddenError('Feature is not included in the current plan', { feature, planId: entitlements.planId }); return entitlements; }
  async requireLimit(user, key, increment = 1) { const entitlements = await this.forUser(user); if (!withinLimit(entitlements, key, increment)) throw new ForbiddenError('Plan limit reached', { key, limit: entitlements.limits[key], usage: entitlements.usage[key] || 0 }); return entitlements; }
}
