import { IngestionError } from './errors.js';

const DEFAULT_RETRY_CODES = new Set(['ETIMEDOUT', 'ECONNRESET', 'EAI_AGAIN', 'SOURCE_TIMEOUT', 'UPSTREAM_429', 'UPSTREAM_5XX']);

export class RetryPolicy {
  constructor(options = {}) {
    this.maximumAttempts = Math.max(1, Math.min(10, Number(options.maximumAttempts || 2)));
    this.baseDelayMs = Math.max(0, Number(options.baseDelayMs ?? 250));
    this.maximumDelayMs = Math.max(this.baseDelayMs, Number(options.maximumDelayMs ?? 5_000));
    this.jitterRatio = Math.max(0, Math.min(1, Number(options.jitterRatio ?? 0.2)));
    this.retryCodes = new Set(options.retryCodes || DEFAULT_RETRY_CODES);
  }

  shouldRetry(error, attempt) {
    if (attempt >= this.maximumAttempts) return false;
    if (error?.retryable === true) return true;
    return this.retryCodes.has(error?.code || error?.cause?.code);
  }

  delay(attempt, random = Math.random) {
    const exponential = Math.min(this.maximumDelayMs, this.baseDelayMs * 2 ** Math.max(0, attempt - 1));
    const spread = exponential * this.jitterRatio;
    return Math.max(0, Math.round(exponential - spread + random() * spread * 2));
  }

  async execute(operation, options = {}) {
    let lastError;
    for (let attempt = 1; attempt <= this.maximumAttempts; attempt += 1) {
      try { return await operation({ attempt, maximumAttempts: this.maximumAttempts }); }
      catch (error) {
        lastError = error;
        options.onFailure?.(error, attempt);
        if (!this.shouldRetry(error, attempt)) throw error;
        const delayMs = this.delay(attempt, options.random);
        options.onRetry?.(error, attempt, delayMs);
        if (delayMs) await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
    throw lastError || new IngestionError('Retry operation failed');
  }
}
