import { round } from '../../core/numbers.js';
import { calculateReplayMetrics } from './performance-metrics.js';
import { simulateTrades } from './trade-simulator.js';

function foldRanges(length, folds, minimumTraining = 180) {
  const available = length - minimumTraining;
  if (available <= folds * 30) return [];
  const testSize = Math.floor(available / folds);
  const ranges = [];
  for (let index = 0; index < folds; index += 1) {
    const trainEnd = minimumTraining + index * testSize;
    const testEnd = index === folds - 1 ? length : Math.min(length, trainEnd + testSize);
    ranges.push({ fold: index + 1, trainStart: 0, trainEnd, testStart: Math.max(100, trainEnd - 100), testEnd });
  }
  return ranges;
}

export function walkForwardReplay(candles, inputConfig = {}, options = {}) {
  const folds = Math.max(2, Math.min(12, Number(inputConfig.walkForwardFolds) || 4));
  const ranges = foldRanges(candles.length, folds, Math.max(180, Number(inputConfig.minimumBars) || 180));
  if (!ranges.length) return { available: false, reason: 'INSUFFICIENT_WALK_FORWARD_HISTORY', folds: [] };
  const results = ranges.map(range => {
    const subset = candles.slice(range.testStart, range.testEnd);
    const simulation = simulateTrades(subset, { ...inputConfig, minimumBars: Math.min(140, subset.length) });
    const metrics = calculateReplayMetrics(simulation, options);
    return {
      ...range,
      startAt: subset[0] ? new Date(subset[0].timestamp).toISOString() : null,
      endAt: subset.at(-1) ? new Date(subset.at(-1).timestamp).toISOString() : null,
      metrics
    };
  });
  const usable = results.filter(item => item.metrics.available);
  const profitable = usable.filter(item => Number(item.metrics.totalReturn) > 0).length;
  const returns = usable.map(item => item.metrics.totalReturn).filter(Number.isFinite);
  const drawdowns = usable.map(item => item.metrics.maximumDrawdown).filter(Number.isFinite);
  const winRates = usable.map(item => item.metrics.winRate).filter(Number.isFinite);
  const average = values => values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;
  return {
    available: usable.length >= 2,
    foldCount: usable.length,
    profitableFolds: profitable,
    consistency: usable.length ? round(profitable / usable.length, 4) : null,
    averageReturn: Number.isFinite(average(returns)) ? round(average(returns), 6) : null,
    averageDrawdown: Number.isFinite(average(drawdowns)) ? round(average(drawdowns), 6) : null,
    averageWinRate: Number.isFinite(average(winRates)) ? round(average(winRates), 4) : null,
    folds: results
  };
}
