export class TileCache {
    constructor(maximum = 256) { this.maximum = maximum; this.records = new Map(); }
    get(key) { const value = this.records.get(key); if (!value)
        return null; this.records.delete(key); this.records.set(key, value); return value; }
    set(key, value) { if (this.records.has(key))
        this.records.delete(key); this.records.set(key, value); while (this.records.size > this.maximum) {
        const oldest = this.records.keys().next().value;
        const record = this.records.get(oldest);
        record?.element?.remove?.();
        this.records.delete(oldest);
    } return value; }
    delete(key) { const value = this.records.get(key); value?.element?.remove?.(); return this.records.delete(key); }
    retain(keys) { const wanted = new Set(keys); for (const key of this.records.keys())
        if (!wanted.has(key))
            this.delete(key); }
    clear() { for (const value of this.records.values())
        value?.element?.remove?.(); this.records.clear(); }
    get size() { return this.records.size; }
}
