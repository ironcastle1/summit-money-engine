import { commercialPlan } from './plan-catalog.js';
export function comparePlans(currentId, targetId) {
    const current = commercialPlan(currentId);
    const target = commercialPlan(targetId);
    const gained = target.features.filter(feature => !current.features.includes(feature));
    const lost = current.features.filter(feature => !target.features.includes(feature));
    const limits = Object.fromEntries([...new Set([...Object.keys(current.limits), ...Object.keys(target.limits)])].map(key => [key, { current: current.limits[key] || 0, target: target.limits[key] || 0, delta: (target.limits[key] || 0) - (current.limits[key] || 0) }]));
    return Object.freeze({ current: current.id, target: target.id, priceDeltaMinor: target.amountMinor - current.amountMinor, seatDelta: target.seats - current.seats, gained: Object.freeze(gained), lost: Object.freeze(lost), limits: Object.freeze(limits) });
}
