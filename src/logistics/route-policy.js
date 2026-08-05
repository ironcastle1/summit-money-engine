import { DEFAULT_ROUTE_POLICY, ROUTE_POLICY_IDS } from './constants.js';
import { enumValue } from './validation.js';
const POLICIES = Object.freeze({
  FASTEST: { weights: { time: 0.64, cost: 0.12, risk: 0.14, reliability: 0.10 }, avoidCriticalRisk: false },
  CHEAPEST: { weights: { time: 0.12, cost: 0.66, risk: 0.12, reliability: 0.10 }, avoidCriticalRisk: false },
  LOWEST_RISK: { weights: { time: 0.10, cost: 0.10, risk: 0.68, reliability: 0.12 }, avoidCriticalRisk: true },
  MOST_RELIABLE: { weights: { time: 0.12, cost: 0.10, risk: 0.18, reliability: 0.60 }, avoidCriticalRisk: true },
  BALANCED: DEFAULT_ROUTE_POLICY
});
export function routePolicy(id = 'BALANCED', overrides = {}) {
  const normalized = enumValue(id, ROUTE_POLICY_IDS, 'policyId');
  const base = POLICIES[normalized];
  return Object.freeze({ id: normalized, ...DEFAULT_ROUTE_POLICY, ...base, ...overrides, weights: Object.freeze({ ...DEFAULT_ROUTE_POLICY.weights, ...base.weights, ...(overrides.weights || {}) }) });
}
export function routePolicies() { return ROUTE_POLICY_IDS.map(id => routePolicy(id)); }
