import { ema } from '../markets/indicators/moving-averages.js';
import { rsi, rateOfChange } from '../markets/indicators/momentum.js';
import { atr, bollingerBands } from '../markets/indicators/volatility.js';
import { efficiencyRatio } from '../markets/indicators/trend.js';
import { closeSeries } from '../markets/series.js';

function finite(value) { return Number.isFinite(value); }

function trendPullbackSignal(context, index) {
  const { close, fast, medium, slow, rsi14, atr14, efficiency } = context;
  if (![close[index], fast[index], medium[index], slow[index], rsi14[index], atr14[index], efficiency[index]].every(finite)) return null;
  const bullishTrend = fast[index] > medium[index] && medium[index] > slow[index];
  const bearishTrend = fast[index] < medium[index] && medium[index] < slow[index];
  const pullbackLong = close[index] <= fast[index] * 1.006 && close[index] >= medium[index] * 0.985 && rsi14[index] >= 42 && rsi14[index] <= 62;
  const pullbackShort = close[index] >= fast[index] * 0.994 && close[index] <= medium[index] * 1.015 && rsi14[index] >= 38 && rsi14[index] <= 58;
  if (bullishTrend && pullbackLong && efficiency[index] >= 0.16) return { direction: 'LONG', strength: Math.min(100, 55 + efficiency[index] * 80 + (62 - rsi14[index])) };
  if (bearishTrend && pullbackShort && efficiency[index] >= 0.16) return { direction: 'SHORT', strength: Math.min(100, 55 + efficiency[index] * 80 + (rsi14[index] - 38)) };
  return null;
}

function momentumBreakoutSignal(context, index) {
  const { close, fast, slow, rsi14, roc12, atr14, bands } = context;
  if (![close[index], fast[index], slow[index], rsi14[index], roc12[index], atr14[index], bands.upper[index], bands.lower[index]].every(finite)) return null;
  const longBreakout = close[index] > bands.upper[index] && fast[index] > slow[index] && rsi14[index] >= 56 && roc12[index] > 0;
  const shortBreakout = close[index] < bands.lower[index] && fast[index] < slow[index] && rsi14[index] <= 44 && roc12[index] < 0;
  if (longBreakout) return { direction: 'LONG', strength: Math.min(100, 58 + Math.abs(roc12[index]) * 850 + (rsi14[index] - 56)) };
  if (shortBreakout) return { direction: 'SHORT', strength: Math.min(100, 58 + Math.abs(roc12[index]) * 850 + (44 - rsi14[index])) };
  return null;
}

function meanReversionSignal(context, index) {
  const { close, medium, rsi14, bands, atr14 } = context;
  if (![close[index], medium[index], rsi14[index], bands.upper[index], bands.lower[index], atr14[index]].every(finite)) return null;
  const distance = (close[index] - medium[index]) / atr14[index];
  const lowerExtreme = close[index] <= bands.lower[index] * 1.004 || distance <= -0.9;
  const upperExtreme = close[index] >= bands.upper[index] * 0.996 || distance >= 0.9;
  if (lowerExtreme && rsi14[index] <= 42 && distance <= -0.75) return { direction: 'LONG', strength: Math.min(100, 54 + Math.abs(distance) * 10 + (42 - rsi14[index]) * 0.8) };
  if (upperExtreme && rsi14[index] >= 58 && distance >= 0.75) return { direction: 'SHORT', strength: Math.min(100, 54 + Math.abs(distance) * 10 + (rsi14[index] - 58) * 0.8) };
  return null;
}

export function buildReplayContext(candles) {
  const close = closeSeries(candles);
  return {
    close,
    fast: ema(close, 10),
    medium: ema(close, 20),
    slow: ema(close, 50),
    rsi14: rsi(close, 14),
    roc12: rateOfChange(close, 12),
    atr14: atr(candles, 14),
    bands: bollingerBands(close, 20, 2),
    efficiency: efficiencyRatio(close, 20)
  };
}

export function generateSignal(strategyId, context, index) {
  if (strategyId === 'MOMENTUM_BREAKOUT') return momentumBreakoutSignal(context, index);
  if (strategyId === 'MEAN_REVERSION') return meanReversionSignal(context, index);
  return trendPullbackSignal(context, index);
}
