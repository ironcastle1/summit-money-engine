import { $, text } from '../ui/dom.js';

function value(selector, input, suffix = '') {
  const element = $(selector);
  if (!element) return;
  element.textContent = input === null || input === undefined || Number.isNaN(input) ? 'N/A' : `${input}${suffix}`;
}

function statusClass(value) {
  const normalized = String(value || '').toUpperCase();
  if (['HEALTHY', 'GOOD', 'PASS', 'LIVE', 'READY'].includes(normalized)) return 'good';
  if (['DEGRADED', 'WARN', 'STALE', 'PARTIAL'].includes(normalized)) return 'warn';
  if (['UNHEALTHY', 'POOR', 'FAIL', 'ERROR', 'OFF'].includes(normalized)) return 'bad';
  return 'neutral';
}

function rows(container, records, render) {
  const target = $(container);
  if (!target) return;
  target.replaceChildren(...records.map(render));
}

function cell(label, number, unit = '') {
  const article = document.createElement('article');
  const span = document.createElement('span');
  const strong = document.createElement('strong');
  span.textContent = label;
  strong.textContent = number === null || number === undefined ? 'N/A' : `${number}${unit}`;
  article.append(span, strong);
  return article;
}

export class OpsController {
  constructor(options) {
    this.api = options.api;
    this.initialized = false;
    this.loading = false;
    this.timer = null;
  }

  bind() {
    $('#ops-refresh')?.addEventListener('click', () => this.refresh());
    $('#ops-auto')?.addEventListener('click', event => {
      const active = event.currentTarget.dataset.active !== 'true';
      event.currentTarget.dataset.active = String(active);
      event.currentTarget.textContent = `AUTO ${active ? 'ON' : 'OFF'}`;
      if (active) this.startAuto();
      else this.stopAuto();
    });
    $('#ops-export')?.addEventListener('click', () => this.exportSnapshot());
  }

  async ensureInitialized() {
    if (this.initialized) return;
    this.initialized = true;
    this.bind();
    await this.refresh();
  }

  startAuto() {
    this.stopAuto();
    this.timer = setInterval(() => this.refresh({ quiet: true }), 15_000);
  }

  stopAuto() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  async refresh(options = {}) {
    if (this.loading) return;
    this.loading = true;
    const button = $('#ops-refresh');
    if (button && !options.quiet) { button.disabled = true; button.textContent = '...'; }
    try {
      const [health, quality, build, metrics, clients] = await Promise.all([
        this.api.opsHealth(), this.api.opsQuality(), this.api.opsBuild(), this.api.opsMetrics(), this.api.opsClientReports()
      ]);
      this.last = { health, quality, build, metrics, clients, capturedAt: new Date().toISOString() };
      this.renderHealth(health);
      this.renderQuality(quality);
      this.renderBuild(build);
      this.renderMetrics(metrics);
      this.renderClients(clients);
      text('#ops-updated', new Date().toISOString().slice(11, 19));
      text('#ops-error', '');
      $('#ops-error')?.classList.add('hidden');
    } catch (error) {
      const element = $('#ops-error');
      if (element) { element.textContent = `${error.code || 'OPS_ERROR'} / ${error.message}`; element.classList.remove('hidden'); }
    } finally {
      this.loading = false;
      if (button && !options.quiet) { button.disabled = false; button.textContent = 'REFRESH'; }
    }
  }

  renderHealth(health) {
    for (const state of [$('#ops-health-state'), $('#ops-health-detail-state')].filter(Boolean)) { state.textContent = health.status || 'N/A'; state.className = statusClass(health.status); }
    value('#ops-ready', health.ready ? 'YES' : 'NO');
    value('#ops-uptime', health.runtime?.uptimeSeconds, 'S');
    value('#ops-memory', health.runtime?.memoryMb?.rss, ' MB');
    value('#ops-heap', health.runtime?.memoryMb?.heapUsed, ' MB');
    value('#ops-loop-p95', health.runtime?.eventLoopMs?.p95, ' MS');
    value('#ops-source-live', health.sourceSummary ? `${health.sourceSummary.configured - health.sourceSummary.failed}/${health.sourceSummary.configured}` : null);
    value('#ops-source-degraded', health.sourceSummary?.degraded);
    rows('#ops-health-checks', health.checks || [], check => {
      const row = document.createElement('div');
      row.className = `ops-row ${statusClass(check.status)}`;
      row.innerHTML = `<span>${check.id.toUpperCase()}</span><b>${check.status}</b><strong>${check.value ?? 'N/A'}${check.unit || ''}${check.total ? `/${check.total}` : ''}</strong>`;
      return row;
    });
  }

  renderQuality(quality) {
    const state = $('#ops-quality-state');
    if (state) { state.textContent = quality.status || 'N/A'; state.className = statusClass(quality.status); }
    value('#ops-quality-score', quality.score, '%');
    value('#ops-source-quality', quality.sources?.score, '%');
    value('#ops-catalog-quality', quality.catalogs?.score, '%');
    value('#ops-cache-entries', quality.cache?.entries);
    value('#ops-cache-hits', quality.cache?.hits);
    const groups = Object.entries(quality.sources?.groups || {});
    rows('#ops-source-quality-rows', groups, ([name, group]) => {
      const row = document.createElement('div');
      row.className = `ops-row ${statusClass(group.meanScore >= 80 ? 'GOOD' : group.meanScore >= 50 ? 'WARN' : 'FAIL')}`;
      row.innerHTML = `<span>${name.toUpperCase()}</span><b>${group.meanScore ?? 'N/A'}%</b><strong>${group.live}/${group.configured}</strong>`;
      return row;
    });
    rows('#ops-catalog-checks', quality.catalogs?.checks || [], check => {
      const row = document.createElement('div');
      row.className = `ops-row ${statusClass(check.status)}`;
      row.innerHTML = `<span>${check.id.toUpperCase()}</span><b>${check.status}</b><strong>${check.value ?? check.duplicates ?? check.invalid ?? 'N/A'}</strong>`;
      return row;
    });
  }

  renderBuild(build) {
    value('#ops-version', build.version);
    value('#ops-node', build.node);
    value('#ops-environment', String(build.environment || '').toUpperCase());
    value('#ops-commit', build.commitSha ? build.commitSha.slice(0, 12) : 'N/A');
    value('#ops-region', build.region || 'N/A');
    value('#ops-deployment', build.deploymentId ? String(build.deploymentId).slice(0, 18) : 'N/A');
    const target = $('#ops-capabilities');
    if (target) target.replaceChildren(...(build.capabilities || []).map(name => {
      const span = document.createElement('span'); span.textContent = name; return span;
    }));
  }

  renderMetrics(metrics) {
    const requestCounter = (metrics.counters || []).filter(item => item.name === 'merlin_http_requests_total').reduce((sum, item) => sum + item.value, 0);
    const errorCounter = (metrics.counters || []).filter(item => item.name === 'merlin_http_errors_total' && item.labels.class === '5xx').reduce((sum, item) => sum + item.value, 0);
    const slowCounter = (metrics.counters || []).filter(item => item.name === 'merlin_http_slow_requests_total').reduce((sum, item) => sum + item.value, 0);
    const latency = (metrics.histograms || []).filter(item => item.name === 'merlin_http_request_duration_ms');
    const totalLatency = latency.reduce((sum, item) => sum + item.sum, 0);
    const totalCount = latency.reduce((sum, item) => sum + item.count, 0);
    value('#ops-requests', requestCounter);
    value('#ops-errors', errorCounter);
    value('#ops-error-rate', requestCounter ? Math.round((errorCounter / requestCounter) * 10000) / 100 : 0, '%');
    value('#ops-slow', slowCounter);
    value('#ops-latency-mean', totalCount ? Math.round(totalLatency / totalCount) : null, ' MS');
    const routes = latency.map(item => ({ route: item.labels.route, method: item.labels.method, count: item.count, mean: item.mean, maximum: item.maximum })).sort((a, b) => b.mean - a.mean).slice(0, 20);
    rows('#ops-route-metrics', routes, route => {
      const row = document.createElement('div');
      row.className = 'ops-route-row';
      row.innerHTML = `<b>${route.method}</b><span>${route.route}</span><strong>${Math.round(route.mean || 0)} MS</strong><small>N=${route.count} / MAX ${Math.round(route.maximum || 0)}</small>`;
      return row;
    });
  }

  renderClients(clients) {
    value('#ops-client-reports', clients.count);
    value('#ops-client-errors', clients.byType?.ERROR || 0);
    const vitals = Object.entries(clients.vitals || {}).map(([name, item]) => ({ name, ...item }));
    rows('#ops-vitals', vitals, vital => cell(vital.name, vital.mean === null ? null : Math.round(vital.mean * 100) / 100, vital.name === 'CLS' ? '' : ' MS'));
  }

  exportSnapshot() {
    if (!this.last) return;
    const blob = new Blob([JSON.stringify(this.last, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `merlin-system-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  }
}
