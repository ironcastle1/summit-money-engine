import { ACCESSIBILITY_REQUIREMENTS } from '../market-readiness/accessibility-policy.js';
import { BROWSER_MATRIX, CUSTOMER_JOURNEYS, DEVICE_MATRIX, THEMES } from '../market-readiness/catalog.js';
import { buildMarketReadinessDiagnostics } from '../market-readiness/diagnostics.js';
import { createDemoWorkspace } from '../market-readiness/demo-workspace.js';
import { exportReadiness } from '../market-readiness/exporters.js';
import { CustomerJourneyService } from '../market-readiness/journey-service.js';
import { buildOnboardingPlan } from '../market-readiness/onboarding-plan.js';
import { createPerformanceBudget, evaluatePerformance } from '../market-readiness/performance-budget.js';
import { calculateReadinessScore } from '../market-readiness/readiness-score.js';
import { evaluateMarketReadinessGate } from '../market-readiness/release-gate.js';

export function createMarketReadinessPlatformService(options = {}) {
  const journeys = new CustomerJourneyService();
  const budget = createPerformanceBudget(options.performanceBudget);
  let latestMetrics = {};
  let latestAccessibility = [];
  let latestGate = null;

  function catalog() {
    return Object.freeze({ version: '20.20.0', devices: DEVICE_MATRIX, browsers: BROWSER_MATRIX, journeys: CUSTOMER_JOURNEYS, themes: THEMES, accessibility: ACCESSIBILITY_REQUIREMENTS, performanceBudget: budget });
  }

  function snapshot() {
    const performance = evaluatePerformance(latestMetrics, budget);
    const journeySnapshot = journeys.snapshot();
    const accessibilityPassed = latestAccessibility.filter(item => item.status === 'PASS').length;
    const accessibilityScore = ACCESSIBILITY_REQUIREMENTS.length ? Math.round((accessibilityPassed / ACCESSIBILITY_REQUIREMENTS.length) * 100) : 0;
    const readiness = calculateReadinessScore({
      browser: journeySnapshot.passRate,
      responsive: journeySnapshot.coverage,
      accessibility: accessibilityScore,
      performance: performance.status === 'PASS' ? 100 : performance.status === 'FAIL' ? 0 : 50,
      journeys: journeySnapshot.passRate,
      reliability: options.reliabilityStatus === 'PASS' ? 100 : 90,
      security: options.securityStatus === 'PASS' ? 100 : 90
    });
    return Object.freeze({ version: '20.20.0', readiness, performance, journeys: journeySnapshot, accessibility: { score: accessibilityScore, results: latestAccessibility }, gate: latestGate, generatedAt: new Date().toISOString() });
  }

  return Object.freeze({
    catalog,
    snapshot,
    onboarding: completed => buildOnboardingPlan({ completed }),
    demo: () => createDemoWorkspace(),
    recordJourney: input => journeys.record(input),
    recordMetrics: input => { latestMetrics = { ...input }; return evaluatePerformance(latestMetrics, budget); },
    recordAccessibility: input => { latestAccessibility = Array.isArray(input) ? input.slice() : []; return snapshot().accessibility; },
    evaluateGate: input => { latestGate = evaluateMarketReadinessGate(input); return latestGate; },
    diagnostics: () => buildMarketReadinessDiagnostics({ version: '20.20.0', journeys, gate: latestGate }),
    export: format => exportReadiness(snapshot(), format)
  });
}
