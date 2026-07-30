export class CircuitBreaker {
  #name;
  #failureThreshold;
  #cooldownMs;
  #halfOpenMaxCalls;
  #state = 'CLOSED';
  #failureCount = 0;
  #openedAt = null;
  #halfOpenCalls = 0;
  #lastError = null;

  constructor(options = {}) {
    this.#name = options.name || 'upstream';
    this.#failureThreshold = options.failureThreshold || 3;
    this.#cooldownMs = options.cooldownMs || 60_000;
    this.#halfOpenMaxCalls = options.halfOpenMaxCalls || 1;
  }

  canExecute(now = Date.now()) {
    if (this.#state === 'CLOSED') return true;
    if (this.#state === 'OPEN' && now - this.#openedAt >= this.#cooldownMs) {
      this.#state = 'HALF_OPEN';
      this.#halfOpenCalls = 0;
    }
    if (this.#state === 'HALF_OPEN' && this.#halfOpenCalls < this.#halfOpenMaxCalls) {
      this.#halfOpenCalls += 1;
      return true;
    }
    return false;
  }

  success() {
    this.#state = 'CLOSED';
    this.#failureCount = 0;
    this.#openedAt = null;
    this.#halfOpenCalls = 0;
    this.#lastError = null;
  }

  failure(error, now = Date.now()) {
    this.#lastError = error instanceof Error ? error.message : String(error);
    this.#failureCount += 1;
    if (this.#state === 'HALF_OPEN' || this.#failureCount >= this.#failureThreshold) {
      this.#state = 'OPEN';
      this.#openedAt = now;
      this.#halfOpenCalls = 0;
    }
  }

  snapshot(now = Date.now()) {
    return {
      name: this.#name,
      state: this.#state,
      failureCount: this.#failureCount,
      openedAt: this.#openedAt ? new Date(this.#openedAt).toISOString() : null,
      retryInMs: this.#state === 'OPEN' ? Math.max(0, this.#cooldownMs - (now - this.#openedAt)) : 0,
      lastError: this.#lastError
    };
  }
}
