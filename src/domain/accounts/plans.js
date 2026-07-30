export const PLAN_IDS = Object.freeze(['FREE', 'PRO', 'TEAM']);

const planDefinitions = {
  FREE: {
    id: 'FREE', name: 'Free', currency: 'GBP', interval: 'month', amountMinor: 0,
    limits: { watchlists: 8, workspaces: 2, alertRules: 3, savedSearches: 3, exportsPerDay: 5, apiRequestsPerDay: 500 },
    features: ['MAP', 'NEWS', 'MARKETS', 'PUBLIC_SOURCES']
  },
  PRO: {
    id: 'PRO', name: 'Pro', currency: 'GBP', interval: 'month', amountMinor: 1900,
    limits: { watchlists: 100, workspaces: 50, alertRules: 50, savedSearches: 100, exportsPerDay: 250, apiRequestsPerDay: 20000 },
    features: ['MAP', 'NEWS', 'MARKETS', 'SHIPPING', 'PLACES', 'OPPORTUNITIES', 'REPLAY', 'ALERTS', 'EXPORT', 'PREMIUM_SOURCES']
  },
  TEAM: {
    id: 'TEAM', name: 'Team', currency: 'GBP', interval: 'month', amountMinor: 5900,
    limits: { watchlists: 500, workspaces: 250, alertRules: 250, savedSearches: 500, exportsPerDay: 2000, apiRequestsPerDay: 100000 },
    features: ['MAP', 'NEWS', 'MARKETS', 'SHIPPING', 'PLACES', 'OPPORTUNITIES', 'REPLAY', 'ALERTS', 'EXPORT', 'PREMIUM_SOURCES', 'TEAM_ADMIN', 'AUDIT_EXPORT']
  }
};

export const PLANS = Object.freeze(Object.fromEntries(Object.entries(planDefinitions).map(([id, plan]) => [id, Object.freeze({ ...plan, limits: Object.freeze(plan.limits), features: Object.freeze(plan.features) })])));

export function getPlan(id) {
  return PLANS[String(id || '').trim().toUpperCase()] || PLANS.FREE;
}

export function publicPlan(plan) {
  const value = getPlan(plan?.id || plan);
  return { ...value, price: value.amountMinor / 100 };
}
