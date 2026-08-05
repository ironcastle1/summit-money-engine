import { stableBucket } from './ids.js';
export function evaluateFeatureFlag(flag, context = {}) { if (!flag || flag.active === false || flag.rollout === 'OFF')
    return Object.freeze({ enabled: false, reason: 'FLAG_OFF' }); if (flag.rollout === 'ON')
    return Object.freeze({ enabled: true, reason: 'GLOBAL_ON' }); if (flag.planIds?.length && !flag.planIds.includes(String(context.planId || '').toUpperCase()))
    return Object.freeze({ enabled: false, reason: 'PLAN_NOT_INCLUDED' }); if (flag.rollout === 'INTERNAL')
    return Object.freeze({ enabled: Boolean(context.internal), reason: context.internal ? 'INTERNAL_USER' : 'NOT_INTERNAL' }); if (flag.rollout === 'TENANTS')
    return Object.freeze({ enabled: flag.tenantIds.includes(String(context.tenantId || '')), reason: flag.tenantIds.includes(String(context.tenantId || '')) ? 'TENANT_INCLUDED' : 'TENANT_NOT_INCLUDED' }); const bucket = stableBucket(`${flag.key}:${context.tenantId || context.userId || 'anonymous'}`); return Object.freeze({ enabled: bucket < Number(flag.percentage || 0), reason: 'PERCENTAGE_ROLLOUT', bucket, percentage: Number(flag.percentage || 0) }); }
