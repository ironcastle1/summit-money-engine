export class AutomationMetrics {
    constructor() { this.counters = new Map(); this.timings = new Map(); }
    increment(name, value = 1) { this.counters.set(name, (this.counters.get(name) || 0) + Number(value || 0)); }
    observe(name, value) { const items = this.timings.get(name) || []; items.push(Number(value) || 0); if (items.length > 1000)
        items.shift(); this.timings.set(name, items); }
    snapshot() { const timings = {}; for (const [name, items] of this.timings)
        timings[name] = { count: items.length, average: items.length ? Math.round(items.reduce((a, b) => a + b, 0) / items.length) : 0, p95: items.length ? [...items].sort((a, b) => a - b)[Math.floor((items.length - 1) * 0.95)] : 0 }; return Object.freeze({ counters: Object.freeze(Object.fromEntries(this.counters)), timings: Object.freeze(timings) }); }
}
