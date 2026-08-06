export class RetentionPolicy {
    constructor(options = {}) {
        this.defaultDays = options.defaultDays || 90;
        this.rules = new Map(Object.entries(options.rules || {
            CRITICAL: 730,
            MATERIAL: 365,
            NOTABLE: 180,
            ROUTINE: 30,
            RAW_RECORD: 90,
            AUDIT: 2555
        }));
    }
    retentionDays(item) {
        const keys = [item?.retentionClass, item?.materiality?.level, item?.type, item?.category].filter(Boolean).map(value => String(value).toUpperCase());
        for (const key of keys)
            if (this.rules.has(key))
                return Number(this.rules.get(key));
        return this.defaultDays;
    }
    expiresAt(item, reference = null) {
        const timestamp = Date.parse(reference || item?.updatedAt || item?.timestamp || item?.createdAt || new Date().toISOString());
        return new Date(timestamp + this.retentionDays(item) * 86400000).toISOString();
    }
    expired(item, now = Date.now()) {
        return Date.parse(this.expiresAt(item)) <= Number(now);
    }
    partition(items = [], now = Date.now()) {
        const keep = [];
        const remove = [];
        for (const item of items)
            (this.expired(item, now) ? remove : keep).push(item);
        return { keep, remove, retained: keep.length, expired: remove.length };
    }
    explain(item) {
        const days = this.retentionDays(item);
        return {
            days,
            expiresAt: this.expiresAt(item),
            class: item?.retentionClass || item?.materiality?.level || item?.type || 'DEFAULT',
            policy: 'Merlin V20 intelligence retention policy'
        };
    }
}
