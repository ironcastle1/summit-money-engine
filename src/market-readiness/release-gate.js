export function evaluateMarketReadinessGate(input = {}) {
  const checks = [
    gate('product-tests', input.productTestsPassed === true, input.productTests || null),
    gate('browser-journeys', Number(input.browserJourneyPassRate) >= 95, input.browserJourneyPassRate),
    gate('required-viewports', input.requiredViewportsPassed === true, input.viewportEvidence || null),
    gate('accessibility', Number(input.accessibilityScore) >= 90, input.accessibilityScore),
    gate('performance', input.performanceStatus === 'PASS', input.performanceStatus || 'NOT_MEASURED'),
    gate('security', input.securityPassed === true, input.securityPassed),
    gate('offline-recovery', input.offlineRecoveryPassed === true, input.offlineRecoveryPassed),
    gate('no-critical-errors', Number(input.criticalErrors || 0) === 0, input.criticalErrors || 0)
  ];
  const failed = checks.filter(check => check.status === 'FAIL');
  return Object.freeze({
    status: failed.length ? 'BLOCKED' : 'APPROVED',
    checks,
    failed: failed.map(check => check.id),
    evaluatedAt: new Date().toISOString()
  });
}

function gate(id, passed, evidence) {
  return Object.freeze({ id, status: passed ? 'PASS' : 'FAIL', evidence });
}
