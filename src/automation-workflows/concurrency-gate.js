export class ConcurrencyGate {
    constructor(limit = 4) { this.limit = Math.max(1, Number(limit) || 4); this.active = 0; this.queue = []; }
    async run(operation) {
        if (this.active >= this.limit)
            await new Promise(resolve => this.queue.push(resolve));
        this.active += 1;
        try {
            return await operation();
        }
        finally {
            this.active -= 1;
            this.queue.shift()?.();
        }
    }
    snapshot() { return Object.freeze({ limit: this.limit, active: this.active, queued: this.queue.length }); }
}
