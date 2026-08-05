import { mean, round, standardDeviation } from './numbers.js';
import { returnSeries } from './returns.js';
export function correlation(left = [], right = []) {
  const a = returnSeries(left); const b = returnSeries(right); const length = Math.min(a.length, b.length);
  if (length < 3) return 0;
  const x = a.slice(-length); const y = b.slice(-length); const mx = mean(x); const my = mean(y);
  const sx = standardDeviation(x); const sy = standardDeviation(y); if (!sx || !sy) return 0;
  return round(x.reduce((sum, value, index) => sum + (value - mx) * (y[index] - my), 0) / ((length - 1) * sx * sy), 4);
}
export function buildCorrelationMatrix(assets = [], period = 60) {
  const selected = assets.map(asset => ({ id: asset.id || asset.symbol, prices: (asset.prices || []).slice(-period - 1) }));
  const matrix = selected.map(left => selected.map(right => left.id === right.id ? 1 : correlation(left.prices, right.prices)));
  const pairs = [];
  for (let i = 0; i < selected.length; i += 1) for (let j = i + 1; j < selected.length; j += 1) pairs.push({ left: selected[i].id, right: selected[j].id, correlation: matrix[i][j] });
  return Object.freeze({ labels: Object.freeze(selected.map(item => item.id)), matrix: Object.freeze(matrix.map(row => Object.freeze(row))), strongest: Object.freeze(pairs.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation)).slice(0, 20)) });
}
