export const INGESTION_STATES = Object.freeze({
  IDLE: 'IDLE', RUNNING: 'RUNNING', COMPLETE: 'COMPLETE', DEGRADED: 'DEGRADED', FAILED: 'FAILED', CANCELLED: 'CANCELLED'
});

export const RECORD_STATES = Object.freeze({
  ACCEPTED: 'ACCEPTED', REJECTED: 'REJECTED', DUPLICATE: 'DUPLICATE', QUARANTINED: 'QUARANTINED'
});

export const SOURCE_MODES = Object.freeze({
  LIVE: 'LIVE', SNAPSHOT: 'SNAPSHOT', CATALOG: 'CATALOG', DERIVED: 'DERIVED', DISABLED: 'DISABLED'
});

export const QUALITY_DIMENSIONS = Object.freeze([
  'completeness', 'freshness', 'validity', 'uniqueness', 'provenance', 'consistency'
]);

export const DEFAULT_INGESTION_LIMITS = Object.freeze({
  concurrency: 4,
  sourceTimeoutMs: 12_000,
  maximumRecordsPerSource: 20_000,
  maximumDeadLetters: 5_000,
  maximumProvenanceEntries: 50_000,
  maximumRunHistory: 200
});
