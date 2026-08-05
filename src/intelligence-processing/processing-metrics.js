export class ProcessingMetrics {
    constructor() { this.counters = new Map(); this.timings = new Map(); this.startedAt = new Date().toISOString(); }
    increment(name, value = 1) { this.counters.set(name, (this.counters.get(name) || 0) + Number(value || 0)); }
    observe(name, milliseconds) {
        if (!this.timings.has(name))
            this.timings.set(name, []);
        const values = this.timings.get(name);
        values.push(Number(milliseconds) || 0);
        if (values.length > 1000)
            values.shift();
    }
    timer(name) { const start = performance.now(); return () => this.observe(name, performance.now() - start); }
    snapshot() {
        const timings = {};
        for (const [name, values] of this.timings)
            timings[name] = { count: values.length, averageMs: round(avg(values)), p95Ms: round(percentile(values, 0.95)), maxMs: round(Math.max(...values, 0)) };
        return { startedAt: this.startedAt, counters: Object.fromEntries(this.counters), timings };
    }
}
function avg(values) { return values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0; }
function percentile(values, p) {
    if (!values.length)
        return 0;
    const sorted = [...values].sort((a, b) => a - b);
    return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))];
}
function round(value) { return Math.round(value * 100) / 100; }
