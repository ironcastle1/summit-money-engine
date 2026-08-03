const THRESHOLDS = Object.freeze({
  LCP: [2500, 4000],
  INP: [200, 500],
  CLS: [0.1, 0.25],
  FCP: [1800, 3000],
  TTFB: [800, 1800]
});

function rating(name, value) {
  const threshold = THRESHOLDS[name];
  if (!threshold || !Number.isFinite(value)) return 'N/A';
  return value <= threshold[0] ? 'GOOD' : value <= threshold[1] ? 'NEEDS_IMPROVEMENT' : 'POOR';
}

function supported(type) { return typeof PerformanceObserver !== 'undefined' && PerformanceObserver.supportedEntryTypes?.includes(type); }

export class ClientMetrics {
  constructor(options = {}) {
    this.report = options.report || (() => Promise.resolve());
    this.version = options.version || 'N/A';
    this.sent = new Set();
    this.cls = 0;
    this.lcp = null;
    this.inp = null;
  }

  send(name, value, extra = {}) {
    const key = `${name}:${Math.round(Number(value) * 100)}`;
    if (this.sent.has(key)) return;
    this.sent.add(key);
    this.report({ type: 'WEB_VITAL', name, value, rating: rating(name, value), route: location.pathname, clientVersion: this.version, ...extra }).catch(() => {});
  }

  start() {
    this.observeNavigation();
    this.observePaint();
    this.observeLcp();
    this.observeCls();
    this.observeInp();
    this.observeErrors();
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') this.flush(); });
    window.addEventListener('pagehide', () => this.flush());
  }

  observeNavigation() {
    const entry = performance.getEntriesByType('navigation')[0];
    if (!entry) return;
    const ttfb = Math.max(0, entry.responseStart - entry.requestStart);
    queueMicrotask(() => this.send('TTFB', ttfb));
  }

  observePaint() {
    if (!supported('paint')) return;
    const observer = new PerformanceObserver(list => {
      for (const entry of list.getEntries()) if (entry.name === 'first-contentful-paint') this.send('FCP', entry.startTime);
    });
    observer.observe({ type: 'paint', buffered: true });
  }

  observeLcp() {
    if (!supported('largest-contentful-paint')) return;
    const observer = new PerformanceObserver(list => { const entries = list.getEntries(); this.lcp = entries.at(-1)?.startTime ?? this.lcp; });
    observer.observe({ type: 'largest-contentful-paint', buffered: true });
  }

  observeCls() {
    if (!supported('layout-shift')) return;
    const observer = new PerformanceObserver(list => {
      for (const entry of list.getEntries()) if (!entry.hadRecentInput) this.cls += entry.value;
    });
    observer.observe({ type: 'layout-shift', buffered: true });
  }

  observeInp() {
    if (!supported('event')) return;
    const observer = new PerformanceObserver(list => {
      for (const entry of list.getEntries()) this.inp = Math.max(this.inp || 0, entry.duration || 0);
    });
    try { observer.observe({ type: 'event', buffered: true, durationThreshold: 40 }); } catch {}
  }

  observeErrors() {
    window.addEventListener('error', event => this.report({ type: 'ERROR', name: 'WINDOW_ERROR', message: event.message, stack: event.error?.stack || '', route: location.pathname, clientVersion: this.version }).catch(() => {}));
    window.addEventListener('unhandledrejection', event => this.report({ type: 'ERROR', name: 'UNHANDLED_REJECTION', message: String(event.reason?.message || event.reason || 'Unknown rejection'), stack: event.reason?.stack || '', route: location.pathname, clientVersion: this.version }).catch(() => {}));
    window.addEventListener('merlin:connectivity', event => this.report({ type: 'CONNECTIVITY', name: event.detail.online ? 'ONLINE' : 'OFFLINE', online: event.detail.online, effectiveType: event.detail.effectiveType, route: location.pathname, clientVersion: this.version }).catch(() => {}));
  }

  flush() {
    if (this.lcp !== null) this.send('LCP', this.lcp);
    this.send('CLS', this.cls);
    if (this.inp !== null) this.send('INP', this.inp);
  }
}
