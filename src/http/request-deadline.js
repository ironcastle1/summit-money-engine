import { ApplicationError } from '../core/errors.js';

export function createRequestDeadline(options = {}) {
  const timeoutMs = Number.isFinite(options.timeoutMs) ? Math.max(100, options.timeoutMs) : 30_000;
  const controller = new AbortController();
  const startedAt = performance.now();
  const timer = setTimeout(() => {
    const error = new ApplicationError('Request deadline exceeded', {
      code: 'REQUEST_DEADLINE_EXCEEDED',
      statusCode: 504,
      expose: true
    });
    error.retryAfterSeconds = 1;
    controller.abort(error);
  }, timeoutMs);

  return Object.freeze({
    signal: controller.signal,
    timeoutMs,
    elapsedMs: () => Math.round(performance.now() - startedAt),
    remainingMs: () => Math.max(0, timeoutMs - (performance.now() - startedAt)),
    clear: () => clearTimeout(timer)
  });
}
