import { finite, clamp } from './utilities.js';
export function canaryAnalysis(input = {}) {
    const baseline = input.baseline || {};
    const canary = input.canary || {};
    const errorDelta = finite(canary.errorRate) - finite(baseline.errorRate);
    const latencyDelta = finite(canary.p95LatencyMs) - finite(baseline.p95LatencyMs);
    const saturationDelta = finite(canary.saturation) - finite(baseline.saturation);
    const score = clamp(100 - Math.max(0, errorDelta) * 1200 - Math.max(0, latencyDelta) / 8 - Math.max(0, saturationDelta) * 0.5);
    const blockers = [];
    if (errorDelta > 0.01)
        blockers.push('ERROR_RATE_REGRESSION');
    if (latencyDelta > 250)
        blockers.push('LATENCY_REGRESSION');
    if (saturationDelta > 20)
        blockers.push('SATURATION_REGRESSION');
    if (canary.syntheticPassed === false)
        blockers.push('SYNTHETIC_FAILURE');
    return Object.freeze({ score: Math.round(score), proceed: blockers.length === 0 && score >= 75, state: blockers.length ? 'FAIL' : score < 90 ? 'WARN' : 'PASS', blockers, deltas: Object.freeze({ errorRate: errorDelta, p95LatencyMs: latencyDelta, saturation: saturationDelta }) });
}
