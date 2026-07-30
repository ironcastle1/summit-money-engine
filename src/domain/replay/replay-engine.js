import { timeframe } from '../markets/timeframes.js';
import { calculateReplayMetrics } from './performance-metrics.js';
import { normalizeReplayConfig } from './strategy-schema.js';
import { simulateTrades } from './trade-simulator.js';
import { walkForwardReplay } from './walk-forward.js';

export function runReplay(options) {
  const config = normalizeReplayConfig(options.config || {});
  const definition = timeframe(options.timeframeId);
  const simulation = simulateTrades(options.candles, config);
  if (!simulation.available) return { ...simulation, asset: options.asset, timeframe: options.timeframeId };
  const metrics = calculateReplayMetrics(simulation, { barsPerYear: definition.annualisation });
  const walkForward = walkForwardReplay(options.candles, config, { barsPerYear: definition.annualisation });
  return {
    available: true,
    asset: options.asset,
    timeframe: options.timeframeId,
    source: options.source,
    config,
    metrics,
    walkForward,
    trades: simulation.trades,
    equity: simulation.equity,
    candleCount: options.candles.length,
    firstCandleAt: new Date(options.candles[0].timestamp).toISOString(),
    lastCandleAt: new Date(options.candles.at(-1).timestamp).toISOString(),
    generatedAt: new Date().toISOString()
  };
}
