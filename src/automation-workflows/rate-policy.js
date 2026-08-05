export class RatePolicy {
    constructor(options = {}) { this.buckets = new Map(); this.maximumBuckets = Number(options.maximumBuckets) || 10000; }
    inspect(key, options = {}, now = Date.now()) {
        const limit = Math.max(1, Number(options.limit) || 60);
        const windowMs = Math.max(1000, Number(options.windowMs) || 60000);
        const values = (this.buckets.get(key) || []).filter(value => now - value < windowMs);
        const allowed = values.length < limit;
        return Object.freeze({ allowed, count: values.length, limit, resetAt: new Date((values[0] || now) + windowMs).toISOString() });
    }
    consume(key, options = {}, now = Date.now()) {
        const result = this.inspect(key, options, now);
        if (!result.allowed)
            return result;
        const values = (this.buckets.get(key) || []).filter(value => now - value < (Number(options.windowMs) || 60000));
        values.push(now);
        this.buckets.set(key, values);
        if (this.buckets.size > this.maximumBuckets)
            this.buckets.delete(this.buckets.keys().next().value);
        return Object.freeze({ ...result, count: values.length });
    }
}
