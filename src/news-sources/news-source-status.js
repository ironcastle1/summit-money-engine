export const NEWS_SOURCE_STATES = Object.freeze({
  STARTING: 'STARTING', ONLINE: 'ONLINE', DEGRADED: 'DEGRADED', OFFLINE: 'OFFLINE', NOT_CONFIGURED: 'NOT_CONFIGURED'
});

export function newsSourceHealth(state, input = {}) {
  return Object.freeze({
    state,
    configured: input.configured !== false,
    stale: Boolean(input.stale),
    lastAttemptAt: input.lastAttemptAt || null,
    lastSuccessAt: input.lastSuccessAt || null,
    lastFailureAt: input.lastFailureAt || null,
    lastDurationMs: Number.isFinite(input.lastDurationMs) ? input.lastDurationMs : null,
    recordCount: Number.isFinite(input.recordCount) ? input.recordCount : 0,
    errorCode: input.errorCode || null,
    cache: input.cache || null,
    weight: Number(input.weight || 1),
    queryCount: Number(input.queryCount || 0)
  });
}
