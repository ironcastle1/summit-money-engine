export const MARKET_SOURCE_STATES = Object.freeze({
  STARTING: 'STARTING',
  ONLINE: 'ONLINE',
  DEGRADED: 'DEGRADED',
  OFFLINE: 'OFFLINE',
  NOT_CONFIGURED: 'NOT_CONFIGURED'
});

export function marketSourceHealth(state, values = {}) {
  return Object.freeze({
    state,
    configured: values.configured ?? state !== MARKET_SOURCE_STATES.NOT_CONFIGURED,
    lastAttemptAt: values.lastAttemptAt || null,
    lastSuccessAt: values.lastSuccessAt || null,
    lastFailureAt: values.lastFailureAt || null,
    lastDurationMs: values.lastDurationMs ?? null,
    requestCount: values.requestCount || 0,
    errorCount: values.errorCount || 0,
    errorCode: values.errorCode || null,
    stale: Boolean(values.stale),
    supportedAssetClasses: values.supportedAssetClasses || []
  });
}
