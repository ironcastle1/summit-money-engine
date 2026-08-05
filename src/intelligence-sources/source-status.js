export const INTELLIGENCE_SOURCE_STATES = Object.freeze({
  STARTING: 'STARTING', ONLINE: 'ONLINE', DEGRADED: 'DEGRADED', OFFLINE: 'OFFLINE', NOT_CONFIGURED: 'NOT_CONFIGURED', UNSUPPORTED: 'UNSUPPORTED'
});

export function intelligenceSourceHealth(state, details = {}) {
  return Object.freeze({
    state,
    configured: details.configured ?? state !== INTELLIGENCE_SOURCE_STATES.NOT_CONFIGURED,
    supported: details.supported ?? state !== INTELLIGENCE_SOURCE_STATES.UNSUPPORTED,
    lastAttemptAt: details.lastAttemptAt || null,
    lastSuccessAt: details.lastSuccessAt || null,
    lastFailureAt: details.lastFailureAt || null,
    lastDurationMs: details.lastDurationMs ?? null,
    recordCount: details.recordCount ?? 0,
    errorCode: details.errorCode || null,
    stale: Boolean(details.stale),
    cache: details.cache || null,
    coverage: details.coverage || null
  });
}
