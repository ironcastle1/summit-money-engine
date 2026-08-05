import { clamp, mean, median, round } from './numbers.js';
export function calculateLiquidity(series = [], quote = null) {
  const volumes = series.map(point => Number(point.volume)).filter(value => Number.isFinite(value) && value >= 0);
  const prices = series.map(point => Number(point.close)).filter(Number.isFinite);
  const dollarVolumes = series.map(point => Number(point.volume) * Number(point.close)).filter(Number.isFinite);
  const averageDollarVolume = mean(dollarVolumes.slice(-20)); const medianDollarVolume = median(dollarVolumes.slice(-60));
  const currentDollarVolume = dollarVolumes.at(-1) || 0; const relativeVolume = medianDollarVolume ? currentDollarVolume / medianDollarVolume : 0;
  const price = quote?.price || prices.at(-1) || 0; const spreadPercent = Number(quote?.ask) > 0 && Number(quote?.bid) > 0 ? (quote.ask - quote.bid) / price * 100 : null;
  const depthScore = clamp(Math.log10(Math.max(1, averageDollarVolume)) / 9 * 100, 0, 100);
  const consistency = volumes.length ? clamp(100 - (Math.max(...volumes.slice(-20)) / Math.max(1, mean(volumes.slice(-20))) - 1) * 8, 0, 100) : 0;
  const spreadScore = spreadPercent === null ? 60 : clamp(100 - spreadPercent * 35, 0, 100);
  const score = depthScore * 0.55 + consistency * 0.2 + spreadScore * 0.25;
  return Object.freeze({ score: round(score, 2), state: score >= 75 ? 'DEEP' : score >= 50 ? 'ADEQUATE' : score >= 25 ? 'THIN' : 'ILLIQUID', averageDollarVolume: round(averageDollarVolume, 2), medianDollarVolume: round(medianDollarVolume, 2), relativeVolume: round(relativeVolume, 3), spreadPercent: spreadPercent === null ? null : round(spreadPercent, 4) });
}
