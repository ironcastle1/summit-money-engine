export class BoundedRepository {
    constructor(options = {}) { this.maximum = options.maximum ?? 5000; this.items = new Map(); this.indexes = new Map(); }
    set(item) {
        if (!item?.id)
            throw new TypeError('Repository item requires id');
        if (this.items.has(item.id))
            this.delete(item.id);
        this.items.set(item.id, item);
        this.#index(item);
        this.#prune();
        return item;
    }
    setMany(items = []) { return items.map(item => this.set(item)); }
    get(id) { return this.items.get(String(id)) || null; }
    has(id) { return this.items.has(String(id)); }
    delete(id) {
        const item = this.items.get(String(id));
        if (!item)
            return false;
        this.items.delete(String(id));
        this.#unindex(item);
        return true;
    }
    list(options = {}) {
        let values = [...this.items.values()];
        if (options.predicate)
            values = values.filter(options.predicate);
        if (options.sort)
            values.sort(options.sort);
        const offset = Math.max(0, options.offset || 0);
        return values.slice(offset, offset + Math.max(1, options.limit || this.maximum));
    }
    findBy(field, value, limit = 100) { const ids = this.indexes.get(field)?.get(String(value)) || new Set(); return [...ids].slice(0, limit).map(id => this.items.get(id)).filter(Boolean); }
    clear() { this.items.clear(); this.indexes.clear(); }
    snapshot() { return { size: this.items.size, maximum: this.maximum, indexes: [...this.indexes.keys()] }; }
    #index(item) {
        for (const field of ['sourceId', 'clusterId', 'category', 'status', 'countryCode']) {
            const value = item[field];
            if (value === null || value === undefined)
                continue;
            if (!this.indexes.has(field))
                this.indexes.set(field, new Map());
            const map = this.indexes.get(field);
            if (!map.has(String(value)))
                map.set(String(value), new Set());
            map.get(String(value)).add(item.id);
        }
    }
    #unindex(item) {
        for (const [field, map] of this.indexes) {
            const value = item[field];
            const set = map.get(String(value));
            set?.delete(item.id);
            if (!set?.size)
                map.delete(String(value));
        }
    }
    #prune() {
        while (this.items.size > this.maximum)
            this.delete(this.items.keys().next().value);
    }
}
export class ProcessingRepositories {
    constructor(options = {}) { this.records = new BoundedRepository({ maximum: options.records ?? 10000 }); this.events = new BoundedRepository({ maximum: options.events ?? 5000 }); this.entities = new BoundedRepository({ maximum: options.entities ?? 10000 }); this.narratives = new BoundedRepository({ maximum: options.narratives ?? 2000 }); }
    snapshot() { return { records: this.records.snapshot(), events: this.events.snapshot(), entities: this.entities.snapshot(), narratives: this.narratives.snapshot() }; }
}
