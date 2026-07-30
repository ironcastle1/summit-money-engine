export const SUBSCRIPTION_STATES = Object.freeze(['NONE', 'TRIALING', 'ACTIVE', 'PAST_DUE', 'PAUSED', 'CANCELLED', 'EXPIRED']);
const activeStates = new Set(['TRIALING', 'ACTIVE']);

export function normalizeSubscriptionState(value) {
  const state = String(value || '').trim().toUpperCase();
  return SUBSCRIPTION_STATES.includes(state) ? state : 'NONE';
}

export function isSubscriptionActive(subscription, now = Date.now()) {
  if (!subscription || !activeStates.has(normalizeSubscriptionState(subscription.state))) return false;
  if (subscription.currentPeriodEnd && new Date(subscription.currentPeriodEnd).getTime() <= now) return false;
  return true;
}

export function effectivePlanId(subscription, now = Date.now()) {
  return isSubscriptionActive(subscription, now) ? String(subscription.planId || 'FREE').toUpperCase() : 'FREE';
}

export function transitionAllowed(from, to) {
  const current = normalizeSubscriptionState(from);
  const next = normalizeSubscriptionState(to);
  if (current === next) return true;
  const graph = {
    NONE: ['TRIALING', 'ACTIVE', 'CANCELLED'],
    TRIALING: ['ACTIVE', 'PAST_DUE', 'CANCELLED', 'EXPIRED'],
    ACTIVE: ['PAST_DUE', 'PAUSED', 'CANCELLED', 'EXPIRED'],
    PAST_DUE: ['ACTIVE', 'PAUSED', 'CANCELLED', 'EXPIRED'],
    PAUSED: ['ACTIVE', 'CANCELLED', 'EXPIRED'],
    CANCELLED: ['ACTIVE', 'EXPIRED'],
    EXPIRED: ['ACTIVE', 'TRIALING']
  };
  return graph[current]?.includes(next) || false;
}
