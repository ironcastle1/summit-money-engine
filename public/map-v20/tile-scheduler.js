export class TileScheduler {
    constructor(options = {}) { this.maximumConcurrent = options.maximumConcurrent || 8; this.active = 0; this.queue = []; this.cancelled = new Set(); }
    schedule(key, task, priority = 0) { this.cancelled.delete(key); return new Promise((resolve, reject) => { this.queue.push({ key, task, priority, resolve, reject }); this.queue.sort((a, b) => b.priority - a.priority); this.#drain(); }); }
    cancel(key) { this.cancelled.add(key); this.queue = this.queue.filter(item => { if (item.key !== key)
        return true; item.resolve(null); return false; }); }
    clear() { for (const item of this.queue)
        item.resolve(null); this.queue = []; this.cancelled.clear(); }
    #drain() { while (this.active < this.maximumConcurrent && this.queue.length) {
        const item = this.queue.shift();
        if (this.cancelled.has(item.key)) {
            item.resolve(null);
            continue;
        }
        this.active += 1;
        Promise.resolve().then(item.task).then(value => item.resolve(this.cancelled.has(item.key) ? null : value), item.reject).finally(() => { this.active -= 1; this.#drain(); });
    } }
}
