import { toTimestamp } from '../core/time.js';

export class FreshnessPolicy {
  constructor(options = {}) {
    this.freshMs = Math.max(1_000, Number(options.freshMs || 5 * 60_000));
    this.staleMs = Math.max(this.freshMs, Number(options.staleMs || 60 * 60_000));
    this.expiredMs = Math.max(this.staleMs, Number(options.expiredMs || 24 * 60 * 60_000));
  }

  classify(timestamp, now = Date.now()) {
    const value = toTimestamp(timestamp);
    if (value === null) return { state: 'UNKNOWN', ageMs: null, usable: false };
    const ageMs = Math.max(0, now - value);
    if (ageMs <= this.freshMs) return { state: 'FRESH', ageMs, usable: true };
    if (ageMs <= this.staleMs) return { state: 'STALE', ageMs, usable: true };
    if (ageMs <= this.expiredMs) return { state: 'AGED', ageMs, usable: true };
    return { state: 'EXPIRED', ageMs, usable: false };
  }

  filter(envelopes, options = {}) {
    const allowExpired = options.allowExpired ?? false;
    return envelopes.filter(envelope => allowExpired || this.classify(envelope.observedAt, options.now).usable);
  }

  snapshot() {
    return { freshMs: this.freshMs, staleMs: this.staleMs, expiredMs: this.expiredMs };
  }
}
