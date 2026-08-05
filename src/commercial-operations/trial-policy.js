import { addDays, expired } from './time.js';
import { commercialPlan } from './plan-catalog.js';
export function trialWindow(planId, startedAt = new Date()) { const plan = commercialPlan(planId); const endsAt = addDays(startedAt, plan.trialDays); return Object.freeze({ planId: plan.id, startedAt: new Date(startedAt).toISOString(), endsAt: endsAt.toISOString(), days: plan.trialDays, active: plan.trialDays > 0 && !expired(endsAt) }); }
