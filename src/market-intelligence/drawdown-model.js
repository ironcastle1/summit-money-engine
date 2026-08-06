import { round } from './numbers.js';
export function drawdownSeries(prices = []) {
  let peak = 0;
  return prices.map((raw, index) => {
    const price = Number(raw); peak = Math.max(peak, price);
    return Object.freeze({ index, price, peak, drawdown: peak ? price / peak - 1 : 0 });
  });
}
export function calculateDrawdown(prices = []) {
  const series = drawdownSeries(prices.map(Number).filter(value => Number.isFinite(value) && value > 0));
  if (!series.length) return Object.freeze({ currentPercent: 0, maximumPercent: 0, recoveryBars: 0, underwaterBars: 0 });
  const worst = series.reduce((minimum, point) => Math.min(minimum, point.drawdown), 0);
  const current = series.at(-1).drawdown;
  let underwaterBars = 0; for (let index = series.length - 1; index >= 0 && series[index].drawdown < 0; index -= 1) underwaterBars += 1;
  let recoveryBars = 0; let troughIndex = series.findIndex(point => point.drawdown === worst);
  if (troughIndex >= 0) { const recovered = series.slice(troughIndex).findIndex(point => point.drawdown >= -1e-8); recoveryBars = recovered < 0 ? 0 : recovered; }
  return Object.freeze({ currentPercent: round(current * 100, 3), maximumPercent: round(worst * 100, 3), recoveryBars, underwaterBars });
}
