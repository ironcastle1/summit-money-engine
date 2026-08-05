export class IdempotencyStore {
    constructor(options = {}) { this.maximum = Number(options.maximum) || 20000; this.records = new Map(); }
    get(key, now = Date.now()) {
        const record = this.records.get(String(key));
        if (!record)
            return null;
        if (record.expiresAt <= now) {
            this.records.delete(String(key));
            return null;
        }
        return record.value;
    }
    put(key, value, ttlMs = 86400000, now = Date.now()) {
        if (this.records.size >= this.maximum)
            this.prune(now);
        this.records.set(String(key), { value, expiresAt: now + Math.max(1000, Number(ttlMs) || 86400000) });
        return value;
    }
    prune(now = Date.now()) {
        for (const [key, record] of this.records)
            if (record.expiresAt <= now)
                this.records.delete(key);
        while (this.records.size > this.maximum)
            this.records.delete(this.records.keys().next().value);
    }
}
