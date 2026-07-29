import { UpstreamError } from '../../core/errors.js';
import { sleep } from '../../core/time.js';

function mergeSignals(signals) {
  const controller = new AbortController();
  const abort = signal => {
    if (!controller.signal.aborted) controller.abort(signal?.reason || new Error('Aborted'));
  };
  for (const signal of signals.filter(Boolean)) {
    if (signal.aborted) abort(signal);
    else signal.addEventListener('abort', () => abort(signal), { once: true });
  }
  return controller.signal;
}

export function createFetchClient(options) {
  const defaultTimeoutMs = options.timeoutMs || 12_000;
  const userAgent = options.userAgent;
  const logger = options.logger;

  async function request(url, requestOptions = {}) {
    const attempts = Math.max(1, requestOptions.attempts || 2);
    let lastError;
    for (let attempt = 1; attempt <= attempts; attempt += 1) {
      const timeoutController = new AbortController();
      const timeout = setTimeout(() => timeoutController.abort(new Error('Request timeout')), requestOptions.timeoutMs || defaultTimeoutMs);
      try {
        const response = await fetch(url, {
          method: requestOptions.method || 'GET',
          headers: {
            accept: requestOptions.accept || 'application/json',
            'user-agent': userAgent,
            ...(requestOptions.headers || {})
          },
          body: requestOptions.body,
          signal: mergeSignals([requestOptions.signal, timeoutController.signal])
        });
        if (!response.ok) {
          const retryable = response.status === 408 || response.status === 429 || response.status >= 500;
          const error = new UpstreamError(`HTTP ${response.status}`, {
            upstream: requestOptions.upstream,
            details: { status: response.status, url: String(url) }
          });
          if (!retryable || attempt === attempts) throw error;
          lastError = error;
        } else {
          return response;
        }
      } catch (error) {
        lastError = error;
        if (attempt === attempts || requestOptions.signal?.aborted) break;
      } finally {
        clearTimeout(timeout);
      }
      const backoffMs = Math.min(2_000, 200 * 2 ** (attempt - 1)) + Math.floor(Math.random() * 100);
      logger?.warn('http.retry', { upstream: requestOptions.upstream, attempt, backoffMs, error: lastError });
      await sleep(backoffMs, requestOptions.signal);
    }
    if (lastError instanceof UpstreamError) throw lastError;
    throw new UpstreamError('Upstream request failed', {
      upstream: requestOptions.upstream,
      cause: lastError,
      details: { url: String(url) }
    });
  }

  return Object.freeze({
    async json(url, requestOptions = {}) {
      const response = await request(url, { ...requestOptions, accept: 'application/json' });
      try {
        return await response.json();
      } catch (error) {
        throw new UpstreamError('Invalid JSON response', {
          upstream: requestOptions.upstream,
          cause: error,
          details: { url: String(url) }
        });
      }
    },
    async text(url, requestOptions = {}) {
      const response = await request(url, { ...requestOptions, accept: requestOptions.accept || '*/*' });
      return response.text();
    }
  });
}
