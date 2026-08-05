import { evaluateTrigger } from './trigger-evaluator.js';
export class WorkflowScheduler {
    constructor(options = {}) { this.workflows = options.workflows; this.engine = options.engine; this.intervalMs = Math.max(60000, Number(options.intervalMs) || 60000); this.timer = null; this.running = false; this.lastRuns = new Map(); }
    async tick(owner = 'anonymous', now = new Date()) { if (this.running)
        return Object.freeze({ skipped: true, reason: 'Scheduler already running' }); this.running = true; const results = []; try {
        const workflows = await this.workflows.list(owner, { state: 'ACTIVE' });
        for (const workflow of workflows) {
            const scheduleTriggers = workflow.triggers.filter(trigger => trigger.type === 'SCHEDULE');
            if (!scheduleTriggers.length)
                continue;
            const due = scheduleTriggers.some(trigger => evaluateTrigger(trigger, { now, lastRun: this.lastRuns.get(`${owner}:${workflow.id}`) }).passed);
            if (!due)
                continue;
            const run = await this.engine.execute(workflow, { owner, manual: false, now, payload: { scheduler: true } });
            this.lastRuns.set(`${owner}:${workflow.id}`, new Date());
            results.push(run);
        }
        return Object.freeze({ skipped: false, checked: workflows.length, executed: results.length, runs: Object.freeze(results) });
    }
    finally {
        this.running = false;
    } }
    start(owner = 'anonymous') { if (this.timer)
        return; this.timer = setInterval(() => this.tick(owner).catch(() => { }), this.intervalMs); this.timer.unref?.(); }
    stop() { if (this.timer)
        clearInterval(this.timer); this.timer = null; }
    status() { return Object.freeze({ running: Boolean(this.timer), intervalMs: this.intervalMs, activeTick: this.running, lastRunCount: this.lastRuns.size }); }
}
