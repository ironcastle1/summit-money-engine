const DEFAULT_BUDGETS = Object.freeze({
  initialHtmlBytes: 140_000,
  initialCssBytes: 420_000,
  initialJavaScriptBytes: 1_800_000,
  totalStaticBytes: 5_500_000,
  largestAssetBytes: 1_500_000,
  domNodes: 5_000,
  interactiveMs: 7_500,
  longTaskMs: 250,
  layoutShift: 0.15,
  visibleMarkers: 2_500
});

export function createPerformanceBudget(overrides = {}) {
  return Object.freeze({ ...DEFAULT_BUDGETS, ...overrides });
}

export function evaluatePerformance(metrics = {}, budget = DEFAULT_BUDGETS) {
  const checks = Object.entries(budget).map(([metric, limit]) => {
    const value = Number(metrics[metric]);
    const observed = Number.isFinite(value);
    return Object.freeze({
      metric,
      value: observed ? value : null,
      limit,
      status: !observed ? 'NOT_MEASURED' : value <= limit ? 'PASS' : 'FAIL',
      margin: observed ? limit - value : null
    });
  });
  const failed = checks.filter(check => check.status === 'FAIL');
  const measured = checks.filter(check => check.status !== 'NOT_MEASURED');
  return Object.freeze({
    status: failed.length ? 'FAIL' : measured.length ? 'PASS' : 'NOT_MEASURED',
    checks,
    measured: measured.length,
    failed: failed.length
  });
}
