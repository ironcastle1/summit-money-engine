export class AnomalyDetector {
    analyse(values = [], options = {}) {
        const numbers = values.map(Number).filter(Number.isFinite);
        if (numbers.length < 3)
            return { anomalies: [], mean: numbers[0] || 0, stddev: 0, median: numbers[0] || 0, mad: 0 };
        const mean = average(numbers);
        const stddev = Math.sqrt(average(numbers.map(value => (value - mean) ** 2)));
        const median = quantile(numbers, 0.5);
        const deviations = numbers.map(value => Math.abs(value - median));
        const mad = quantile(deviations, 0.5);
        const zThreshold = options.zThreshold ?? 2.5;
        const robustThreshold = options.robustThreshold ?? 3.5;
        const anomalies = numbers.map((value, index) => { const z = stddev ? (value - mean) / stddev : 0; const robust = mad ? 0.6745 * (value - median) / mad : 0; return { index, value, z, robust, severity: Math.max(Math.abs(z) / zThreshold, Math.abs(robust) / robustThreshold) }; }).filter(item => Math.abs(item.z) >= zThreshold || Math.abs(item.robust) >= robustThreshold).sort((a, b) => b.severity - a.severity);
        return { anomalies, mean, stddev, median, mad, count: numbers.length };
    }
}
function average(values) { return values.reduce((a, b) => a + b, 0) / Math.max(1, values.length); }
function quantile(values, q) { const sorted = [...values].sort((a, b) => a - b); const index = (sorted.length - 1) * q; const low = Math.floor(index), high = Math.ceil(index); return low === high ? sorted[low] : sorted[low] + (sorted[high] - sorted[low]) * (index - low); }
