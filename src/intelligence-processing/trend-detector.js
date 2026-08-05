export function linearRegression(points = []) {
    const values = points.map((point, index) => typeof point === 'number' ? { x: index, y: point } : { x: Number(point.x ?? index), y: Number(point.y ?? point.value) }).filter(point => Number.isFinite(point.x) && Number.isFinite(point.y));
    if (values.length < 2)
        return { slope: 0, intercept: values[0]?.y || 0, r2: 0, count: values.length };
    const meanX = average(values.map(p => p.x));
    const meanY = average(values.map(p => p.y));
    let numerator = 0, denominator = 0, total = 0, residual = 0;
    for (const point of values) {
        numerator += (point.x - meanX) * (point.y - meanY);
        denominator += (point.x - meanX) ** 2;
    }
    const slope = denominator ? numerator / denominator : 0;
    const intercept = meanY - slope * meanX;
    for (const point of values) {
        total += (point.y - meanY) ** 2;
        residual += (point.y - (intercept + slope * point.x)) ** 2;
    }
    return { slope, intercept, r2: total ? Math.max(0, 1 - residual / total) : 1, count: values.length };
}
export class TrendDetector {
    analyse(series = []) { const values = series.map(item => Number(item.value ?? item)).filter(Number.isFinite); const regression = linearRegression(values); const midpoint = Math.max(2, Math.floor(values.length / 2)); const early = linearRegression(values.slice(0, midpoint)); const late = linearRegression(values.slice(midpoint)); const acceleration = late.slope - early.slope; const volatility = stddev(values); const direction = regression.slope > volatility * 0.03 ? 'RISING' : regression.slope < -volatility * 0.03 ? 'FALLING' : 'STABLE'; return { ...regression, acceleration, volatility, direction, strength: Math.min(100, Math.round(Math.abs(regression.slope) / (volatility || 1) * 100 * regression.r2)) }; }
}
function average(values) { return values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0; }
function stddev(values) { const mean = average(values); return Math.sqrt(average(values.map(value => (value - mean) ** 2))); }
