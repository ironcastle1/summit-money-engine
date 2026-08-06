import { errorSummary } from './errors.js';

function percentile(values, p) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor((sorted.length - 1) * p))];
}

function initial(sourceId) {
  return {
    sourceId, state: 'IDLE', configured: true, attempts: 0, successes: 0, failures: 0,
    consecutiveFailures: 0, recordsAccepted: 0, recordsRejected: 0, recordsDuplicate: 0,
    durations: [], lastAttemptAt: null, lastSuccessAt: null, lastFailureAt: null, lastError: null
  };
}

export class SourceHealthMonitor {
  #states = new Map();
  constructor(options = {}) { this.maximumDurations = Math.max(10, Number(options.maximumDurations || 100)); }

  configure(descriptor) {
    const state = this.#states.get(descriptor.id) || initial(descriptor.id);
    state.configured = descriptor.configured;
    state.mode = descriptor.mode;
    state.name = descriptor.name;
    this.#states.set(descriptor.id, state);
  }

  started(sourceId, now = Date.now()) {
    const state = this.#states.get(sourceId) || initial(sourceId);
    state.attempts += 1;
    state.state = 'RUNNING';
    state.lastAttemptAt = new Date(now).toISOString();
    this.#states.set(sourceId, state);
  }

  completed(sourceId, result, durationMs, now = Date.now()) {
    const state = this.#states.get(sourceId) || initial(sourceId);
    state.successes += 1;
    state.consecutiveFailures = 0;
    state.state = result.degraded ? 'DEGRADED' : 'ONLINE';
    state.lastSuccessAt = new Date(now).toISOString();
    state.recordsAccepted += result.accepted || 0;
    state.recordsRejected += result.rejected || 0;
    state.recordsDuplicate += result.duplicates || 0;
    state.lastError = null;
    state.durations.push(durationMs);
    if (state.durations.length > this.maximumDurations) state.durations.shift();
    this.#states.set(sourceId, state);
  }

  failed(sourceId, error, durationMs, now = Date.now()) {
    const state = this.#states.get(sourceId) || initial(sourceId);
    state.failures += 1;
    state.consecutiveFailures += 1;
    state.state = state.successes ? 'DEGRADED' : 'OFFLINE';
    state.lastFailureAt = new Date(now).toISOString();
    state.lastError = errorSummary(error);
    state.durations.push(durationMs);
    if (state.durations.length > this.maximumDurations) state.durations.shift();
    this.#states.set(sourceId, state);
  }

  snapshot(sourceId) {
    const state = this.#states.get(sourceId);
    if (!state) return null;
    const attempts = state.successes + state.failures;
    return Object.freeze({
      ...state,
      durations: undefined,
      successRate: attempts ? Number((state.successes / attempts).toFixed(4)) : null,
      latency: {
        latestMs: state.durations.at(-1) ?? null,
        p50Ms: percentile(state.durations, 0.5),
        p95Ms: percentile(state.durations, 0.95),
        maximumMs: state.durations.length ? Math.max(...state.durations) : null
      }
    });
  }

  all() { return Object.fromEntries([...this.#states.keys()].sort().map(id => [id, this.snapshot(id)])); }
}
