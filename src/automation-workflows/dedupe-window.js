import { fingerprint } from './ids.js';
export class DedupeWindow {
    constructor(options = {}) { this.entries = new Map(); this.maximum = Number(options.maximum) || 10000; }
    key(workflowId, context = {}) { return fingerprint({ workflowId, eventId: context.event?.id || context.signal?.id || context.id, trigger: context.triggerId, payload: context.dedupeKey || null }, 'dedupe-'); }
    seen(key, minutes = 5, now = Date.now()) {
        const entry = this.entries.get(key);
        if (!entry)
            return false;
        if (now - entry > Number(minutes) * 60000) {
            this.entries.delete(key);
            return false;
        }
        return true;
    }
    mark(key, now = Date.now()) {
        if (this.entries.size >= this.maximum)
            this.prune(now);
        this.entries.set(key, Number(now));
        return key;
    }
    prune(now = Date.now(), maximumAgeMinutes = 10080) {
        const cutoff = Number(now) - maximumAgeMinutes * 60000;
        for (const [key, value] of this.entries)
            if (value < cutoff)
                this.entries.delete(key);
        while (this.entries.size > this.maximum)
            this.entries.delete(this.entries.keys().next().value);
    }
}
