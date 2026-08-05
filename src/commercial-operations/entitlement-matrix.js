import { commercialPlan } from './plan-catalog.js';
export function entitlementMatrix(planId, overrides = {}) { const plan = commercialPlan(planId); const features = new Set(plan.features); for (const feature of overrides.addFeatures || [])
    features.add(String(feature).toUpperCase()); for (const feature of overrides.removeFeatures || [])
    features.delete(String(feature).toUpperCase()); const limits = { ...plan.limits, ...(overrides.limits || {}) }; return Object.freeze({ planId: plan.id, features: Object.freeze([...features].sort()), limits: Object.freeze(limits), seats: Number(overrides.seats ?? plan.seats), support: overrides.support || plan.support }); }
