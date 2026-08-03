function normalizeRoute(path) {
  const value = String(path || '/');
  return value
    .replace(/[0-9a-f]{16,}/gi, ':id')
    .replace(/\b\d{4,}\b/g, ':number')
    .slice(0, 180);
}

export class RequestMetrics {
  constructor(options = {}) {
    this.metrics = options.metrics;
    this.slowRequestMs = options.slowRequestMs || 1000;
    this.logger = options.logger;
    this.active = 0;
  }

  begin(context) {
    const startedAt = performance.now();
    this.active += 1;
    this.metrics.setGauge('merlin_http_requests_active', this.active);
    let completed = false;
    return statusCode => {
      if (completed) return;
      completed = true;
      this.active = Math.max(0, this.active - 1);
      this.metrics.setGauge('merlin_http_requests_active', this.active);
      const durationMs = Math.max(0, performance.now() - startedAt);
      const route = normalizeRoute(context.path);
      const status = Number(statusCode) || 0;
      const labels = { method: context.method, route, status: Math.floor(status / 100) + 'xx' };
      this.metrics.increment('merlin_http_requests_total', labels);
      this.metrics.observe('merlin_http_request_duration_ms', durationMs, { method: context.method, route });
      if (status >= 500) this.metrics.increment('merlin_http_errors_total', { method: context.method, route, class: '5xx' });
      else if (status >= 400) this.metrics.increment('merlin_http_errors_total', { method: context.method, route, class: '4xx' });
      if (durationMs >= this.slowRequestMs) {
        this.metrics.increment('merlin_http_slow_requests_total', { method: context.method, route });
        this.logger?.warn('request.slow', { method: context.method, path: context.path, durationMs: Math.round(durationMs), statusCode: status });
      }
    };
  }
}
