import { SHIPPING_SOURCE_STATES } from '../domain/shipping/constants.js';

export function shippingSourceHealth(state, input = {}) {
  return Object.freeze({
    state: Object.values(SHIPPING_SOURCE_STATES).includes(state) ? state : SHIPPING_SOURCE_STATES.OFFLINE,
    configured: Boolean(input.configured), stale: Boolean(input.stale), lastAttemptAt: input.lastAttemptAt || null,
    lastSuccessAt: input.lastSuccessAt || null, lastFailureAt: input.lastFailureAt || null,
    lastDurationMs: Number.isFinite(input.lastDurationMs) ? input.lastDurationMs : null,
    recordCount: Number(input.recordCount || 0), requestCount: Number(input.requestCount || 0),
    errorCount: Number(input.errorCount || 0), errorCode: input.errorCode || null,
    capabilities: Object.freeze([...(input.capabilities || [])]), cache: input.cache || null
  });
}
