import { clamp } from '../../core/numbers.js';

export const STRATEGY_IDS = Object.freeze(['TREND_PULLBACK', 'MOMENTUM_BREAKOUT', 'MEAN_REVERSION']);

export function normalizeReplayConfig(input = {}) {
  const strategyId = STRATEGY_IDS.includes(String(input.strategyId || '').toUpperCase()) ? String(input.strategyId).toUpperCase() : 'TREND_PULLBACK';
  return Object.freeze({
    strategyId,
    startingCapital: clamp(Number(input.startingCapital) || 10_000, 100, 100_000_000),
    riskPerTrade: clamp(Number(input.riskPerTrade) || 0.01, 0.001, 0.1),
    feeRate: clamp(Number(input.feeRate) || 0.001, 0, 0.02),
    slippageRate: clamp(Number(input.slippageRate) || 0.0005, 0, 0.02),
    stopAtr: clamp(Number(input.stopAtr) || 1.8, 0.25, 10),
    targetAtr: clamp(Number(input.targetAtr) || 3.0, 0.25, 20),
    maximumHoldingBars: Math.round(clamp(Number(input.maximumHoldingBars) || 48, 1, 500)),
    minimumBars: Math.round(clamp(Number(input.minimumBars) || 180, 100, 2000)),
    allowShort: input.allowShort !== false,
    walkForwardFolds: Math.round(clamp(Number(input.walkForwardFolds) || 4, 2, 12))
  });
}
