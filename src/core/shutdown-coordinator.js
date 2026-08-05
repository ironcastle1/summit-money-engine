function withTimeout(promise, timeoutMs, label) {
  let timer;
  return Promise.race([
    Promise.resolve(promise),
    new Promise((_, reject) => {
      timer = setTimeout(() => {
        const error = new Error(`Shutdown task timed out: ${label}`);
        error.code = 'SHUTDOWN_TIMEOUT';
        reject(error);
      }, timeoutMs);
      timer.unref?.();
    })
  ]).finally(() => clearTimeout(timer));
}

export class ShutdownCoordinator {
  #tasks = [];
  #state = 'RUNNING';
  #result = null;
  #active = null;

  constructor(options = {}) {
    this.logger = options.logger || null;
    this.taskTimeoutMs = Number.isFinite(options.taskTimeoutMs) ? options.taskTimeoutMs : 8_000;
  }

  get state() {
    return this.#state;
  }

  register(name, close) {
    if (this.#state !== 'RUNNING') throw new Error('Cannot register shutdown tasks after shutdown begins');
    if (!name || typeof name !== 'string') throw new TypeError('Shutdown task name is required');
    if (typeof close !== 'function') throw new TypeError(`Shutdown task ${name} must be a function`);
    if (this.#tasks.some(task => task.name === name)) throw new Error(`Duplicate shutdown task: ${name}`);
    this.#tasks.push(Object.freeze({ name, close }));
    return this;
  }

  async shutdown(reason = 'requested') {
    if (this.#active) return this.#active;
    this.#active = this.#execute(reason);
    return this.#active;
  }

  async #execute(reason) {
    this.#state = 'STOPPING';
    const startedAt = Date.now();
    const results = [];
    this.logger?.info('shutdown.started', { reason, taskCount: this.#tasks.length });

    for (const task of [...this.#tasks].reverse()) {
      const taskStartedAt = Date.now();
      try {
        await withTimeout(task.close(reason), this.taskTimeoutMs, task.name);
        results.push(Object.freeze({
          name: task.name,
          status: 'CLOSED',
          durationMs: Date.now() - taskStartedAt
        }));
      } catch (error) {
        results.push(Object.freeze({
          name: task.name,
          status: 'FAILED',
          durationMs: Date.now() - taskStartedAt,
          error: error instanceof Error ? error.message : String(error)
        }));
        this.logger?.error('shutdown.task_failed', { task: task.name, error });
      }
    }

    const failed = results.filter(result => result.status === 'FAILED');
    this.#state = failed.length ? 'FAILED' : 'STOPPED';
    this.#result = Object.freeze({
      reason,
      state: this.#state,
      durationMs: Date.now() - startedAt,
      results: Object.freeze(results)
    });
    this.logger?.info('shutdown.completed', this.#result);
    return this.#result;
  }

  snapshot() {
    return this.#result || Object.freeze({
      state: this.#state,
      registeredTasks: Object.freeze(this.#tasks.map(task => task.name))
    });
  }
}
