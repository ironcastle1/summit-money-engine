import { getPlan } from './plans.js';
import { effectivePlanId } from './subscription-state.js';
import { roleAtLeast } from './roles.js';

export function buildEntitlements(user, subscription, usage = {}, now = Date.now()) {
  const plan = getPlan(effectivePlanId(subscription, now));
  const elevated = roleAtLeast(user?.role, 'ADMIN');
  const features = new Set(plan.features);
  if (elevated) ['TEAM_ADMIN', 'AUDIT_EXPORT', 'PREMIUM_SOURCES'].forEach(feature => features.add(feature));
  const limits = Object.fromEntries(Object.entries(plan.limits).map(([key, value]) => [key, elevated ? Math.max(value, 1_000_000) : value]));
  const remaining = Object.fromEntries(Object.entries(limits).map(([key, limit]) => [key, Math.max(0, limit - Number(usage[key] || 0))]));
  return { planId: plan.id, features: [...features].sort(), limits, usage: { ...usage }, remaining };
}

export function hasFeature(entitlements, feature) {
  return Array.isArray(entitlements?.features) && entitlements.features.includes(String(feature || '').toUpperCase());
}

export function withinLimit(entitlements, key, increment = 1) {
  const limit = Number(entitlements?.limits?.[key]);
  const used = Number(entitlements?.usage?.[key] || 0);
  return Number.isFinite(limit) && used + increment <= limit;
}
