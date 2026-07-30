export const SOURCE_STATES = Object.freeze({
  ONLINE: 'ONLINE',
  DEGRADED: 'DEGRADED',
  OFFLINE: 'OFFLINE',
  NOT_CONFIGURED: 'NOT_CONFIGURED',
  STARTING: 'STARTING'
});

export function sourceHealth(state, details = {}) {
  return Object.freeze({
    state,
    configured: details.configured ?? state !== SOURCE_STATES.NOT_CONFIGURED,
    lastAttemptAt: details.lastAttemptAt || null,
    lastSuccessAt: details.lastSuccessAt || null,
    lastFailureAt: details.lastFailureAt || null,
    lastDurationMs: Number.isFinite(details.lastDurationMs) ? details.lastDurationMs : null,
    recordCount: Number.isFinite(details.recordCount) ? details.recordCount : 0,
    errorCode: details.errorCode || null,
    stale: Boolean(details.stale),
    cache: details.cache || null,
    weight: Number.isFinite(details.weight) ? details.weight : 1
  });
}
