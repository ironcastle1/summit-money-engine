import { RateLimitError } from '../core/errors.js';

export class SlidingWindowRateLimiter {
  #limit;
  #windowMs;
  #buckets = new Map();
  #lastSweep = 0;

  constructor(options = {}) {
    this.#limit = options.limit || 240;
    this.#windowMs = options.windowMs || 60_000;
  }

  consume(key, now = Date.now()) {
    this.#sweep(now);
    const cutoff = now - this.#windowMs;
    const previous = this.#buckets.get(key) || [];
    const active = previous.filter(timestamp => timestamp > cutoff);
    if (active.length >= this.#limit) {
      const retryAfterSeconds = Math.max(1, Math.ceil((active[0] + this.#windowMs - now) / 1_000));
      throw new RateLimitError(retryAfterSeconds);
    }
    active.push(now);
    this.#buckets.set(key, active);
    return { remaining: Math.max(0, this.#limit - active.length), resetAt: active[0] + this.#windowMs };
  }

  #sweep(now) {
    if (now - this.#lastSweep < this.#windowMs) return;
    this.#lastSweep = now;
    const cutoff = now - this.#windowMs;
    for (const [key, timestamps] of this.#buckets.entries()) {
      const active = timestamps.filter(timestamp => timestamp > cutoff);
      if (active.length) this.#buckets.set(key, active);
      else this.#buckets.delete(key);
    }
  }
}
