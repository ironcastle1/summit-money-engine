import { clamp, finite, ratio } from './utilities.js';
export function errorBudget(slo, measurements = []) {
    const indicator = String(slo?.indicator || '').toUpperCase();
    const target = finite(slo?.target);
    let actual = null;
    if (measurements.length) {
        if (measurements.some(item => item.good !== null && item.total !== null)) {
            const good = measurements.reduce((s, item) => s + finite(item.good), 0);
            const total = measurements.reduce((s, item) => s + finite(item.total), 0);
            actual = total ? good / total * 100 : null;
        }
        else
            actual = measurements.reduce((s, item) => s + finite(item.value), 0) / measurements.length;
    }
    const higherIsBetter = (slo?.comparator || 'GTE') === 'GTE';
    const allowed = higherIsBetter ? Math.max(0, 100 - target) : Math.max(1, target);
    const consumed = actual === null ? 0 : higherIsBetter ? Math.max(0, target - actual) : Math.max(0, actual - target);
    const consumedPercent = clamp(ratio(consumed, allowed) * 100, 0, 10000);
    return Object.freeze({ sloId: slo?.id, indicator, target, actual, allowedError: allowed, consumedError: consumed, consumedPercent, remainingPercent: clamp(100 - consumedPercent), state: actual === null ? 'NO_DATA' : consumedPercent >= 100 ? 'EXHAUSTED' : consumedPercent >= 75 ? 'AT_RISK' : 'HEALTHY', sampleCount: measurements.length });
}
