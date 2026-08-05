export class IngestionScheduler {
  #jobs = new Map();
  #running = new Set();
  #timer = null;

  constructor(options = {}) {
    this.clock = options.clock || (() => Date.now());
    this.tickMs = Math.max(1_000, Number(options.tickMs || 5_000));
    this.logger = options.logger;
  }

  register(id, operation, options = {}) {
    if (typeof operation !== 'function') throw new TypeError('Scheduled operation must be a function');
    const intervalMs = Math.max(this.tickMs, Number(options.intervalMs || 60_000));
    this.#jobs.set(id, {
      id, operation, intervalMs,
      nextRunAt: options.immediate ? this.clock() : this.clock() + intervalMs,
      lastRunAt: null, lastSuccessAt: null, lastFailureAt: null,
      runs: 0, failures: 0, enabled: options.enabled ?? true
    });
    return this;
  }

  start() {
    if (this.#timer) return;
    this.#timer = setInterval(() => this.tick().catch(error => this.logger?.error?.('ingestion.scheduler_tick_failed', { error })), this.tickMs);
    this.#timer.unref?.();
  }

  stop() { clearInterval(this.#timer); this.#timer = null; }

  async tick(now = this.clock()) {
    const due = [...this.#jobs.values()].filter(job => job.enabled && job.nextRunAt <= now && !this.#running.has(job.id));
    await Promise.all(due.map(job => this.#execute(job, now)));
    return due.length;
  }

  async runNow(id) {
    const job = this.#jobs.get(id);
    if (!job) throw new Error(`Unknown ingestion job: ${id}`);
    return this.#execute(job, this.clock());
  }

  async #execute(job, now) {
    this.#running.add(job.id);
    job.runs += 1;
    job.lastRunAt = new Date(now).toISOString();
    try {
      const result = await job.operation();
      job.lastSuccessAt = new Date(this.clock()).toISOString();
      return result;
    } catch (error) {
      job.failures += 1;
      job.lastFailureAt = new Date(this.clock()).toISOString();
      throw error;
    } finally {
      job.nextRunAt = this.clock() + job.intervalMs;
      this.#running.delete(job.id);
    }
  }

  status() {
    return [...this.#jobs.values()].map(job => ({ ...job, operation: undefined, running: this.#running.has(job.id) }));
  }
}
