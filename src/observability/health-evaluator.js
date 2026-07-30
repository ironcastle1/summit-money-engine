const BAD_STATES = new Set(['OFF', 'ERROR', 'UNAVAILABLE']);
const DEGRADED_STATES = new Set(['STALE', 'RATE_LIMITED', 'NOT_CONFIGURED', 'PARTIAL']);

function flattenSources(groups = {}) {
  const output = [];
  for (const [group, sources] of Object.entries(groups)) {
    for (const [id, value] of Object.entries(sources || {})) output.push({ group, id, ...(value || {}) });
  }
  return output;
}

export class HealthEvaluator {
  constructor(options = {}) {
    this.runtime = options.runtime;
    this.sourceGroups = options.sourceGroups || (() => ({}));
    this.maximumHeapRatio = options.maximumHeapRatio || 0.9;
    this.maximumEventLoopP95Ms = options.maximumEventLoopP95Ms || 250;
  }

  snapshot() {
    const runtime = this.runtime.snapshot();
    const sources = flattenSources(this.sourceGroups());
    const configured = sources.filter(source => source.state !== 'NOT_CONFIGURED');
    const failed = configured.filter(source => BAD_STATES.has(source.state));
    const degraded = sources.filter(source => DEGRADED_STATES.has(source.state));
    const heapRatio = runtime.memoryMb.heapTotal ? runtime.memoryMb.heapUsed / runtime.memoryMb.heapTotal : 0;
    const checks = [
      { id: 'process', status: 'PASS', value: runtime.uptimeSeconds, unit: 's' },
      { id: 'heap', status: heapRatio >= this.maximumHeapRatio ? 'FAIL' : heapRatio >= 0.75 ? 'WARN' : 'PASS', value: Math.round(heapRatio * 100), unit: '%' },
      { id: 'event-loop', status: runtime.eventLoopMs.p95 >= this.maximumEventLoopP95Ms ? 'FAIL' : runtime.eventLoopMs.p95 >= 100 ? 'WARN' : 'PASS', value: runtime.eventLoopMs.p95, unit: 'ms' },
      { id: 'sources', status: failed.length ? 'WARN' : 'PASS', value: configured.length - failed.length, total: configured.length },
      { id: 'degraded-sources', status: degraded.length ? 'WARN' : 'PASS', value: degraded.length }
    ];
    const failing = checks.filter(check => check.status === 'FAIL');
    const warning = checks.filter(check => check.status === 'WARN');
    return {
      live: true,
      ready: failing.length === 0,
      status: failing.length ? 'UNHEALTHY' : warning.length ? 'DEGRADED' : 'HEALTHY',
      checks,
      sourceSummary: { total: sources.length, configured: configured.length, failed: failed.length, degraded: degraded.length },
      runtime,
      generatedAt: new Date().toISOString()
    };
  }
}
