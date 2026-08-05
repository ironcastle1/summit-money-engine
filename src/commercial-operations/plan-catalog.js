import { frozen } from './utilities.js';
const definitions = [
    { id: 'FREE', name: 'Free', amountMinor: 0, interval: 'MONTH', seats: 1, trialDays: 0, support: 'COMMUNITY', limits: { apiRequests: 500, exports: 5, alerts: 3, savedViews: 3, reports: 2 }, features: ['MAP', 'NEWS', 'MARKETS', 'PUBLIC_SOURCES'] },
    { id: 'PRO', name: 'Pro', amountMinor: 2900, interval: 'MONTH', seats: 1, trialDays: 14, support: 'STANDARD', limits: { apiRequests: 25000, exports: 500, alerts: 100, savedViews: 100, reports: 100 }, features: ['MAP', 'NEWS', 'MARKETS', 'PLACES', 'OPPORTUNITIES', 'ALERTS', 'EXPORT', 'PREMIUM_SOURCES', 'BRIEFINGS'] },
    { id: 'TEAM', name: 'Team', amountMinor: 9900, interval: 'MONTH', seats: 8, trialDays: 14, support: 'PRIORITY', limits: { apiRequests: 250000, exports: 5000, alerts: 1000, savedViews: 1000, reports: 1000 }, features: ['MAP', 'NEWS', 'MARKETS', 'PLACES', 'OPPORTUNITIES', 'ALERTS', 'EXPORT', 'PREMIUM_SOURCES', 'BRIEFINGS', 'AUTOMATION', 'PUBLISHING', 'TEAM_ADMIN', 'AUDIT_EXPORT'] },
    { id: 'ENTERPRISE', name: 'Enterprise', amountMinor: 0, interval: 'CONTRACT', seats: 50, trialDays: 30, support: 'DEDICATED', limits: { apiRequests: 2000000, exports: 50000, alerts: 10000, savedViews: 10000, reports: 10000 }, features: ['ALL', 'SSO', 'SCIM', 'CUSTOM_RETENTION', 'PRIVATE_CONNECTORS', 'DEDICATED_SUPPORT', 'CUSTOM_BRANDING'] }
];
export const COMMERCIAL_PLANS = Object.freeze(Object.fromEntries(definitions.map(plan => [plan.id, frozen(plan)])));
export function commercialPlan(id) { return COMMERCIAL_PLANS[String(id || '').toUpperCase()] || COMMERCIAL_PLANS.FREE; }
export function publicCommercialPlans() { return Object.values(COMMERCIAL_PLANS).map(plan => ({ ...plan, price: plan.amountMinor / 100 })); }
