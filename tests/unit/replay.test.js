import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeReplayConfig } from '../../src/domain/replay/strategy-schema.js';
import { buildReplayContext, generateSignal } from '../../src/domain/replay/signal-generator.js';
import { simulateTrades } from '../../src/domain/replay/trade-simulator.js';
import { calculateReplayMetrics } from '../../src/domain/replay/performance-metrics.js';
import { walkForwardReplay } from '../../src/domain/replay/walk-forward.js';
import { runReplay } from '../../src/domain/replay/replay-engine.js';

function candles(count = 1000, interval = 3_600_000) {
  const output = [];
  let previous = 100;
  for (let index = 0; index < count; index += 1) {
    const trend = index * 0.018;
    const cycle = Math.sin(index / 8) * 5.8 + Math.sin(index / 29) * 2.4;
    const close = 100 + trend + cycle;
    const open = previous;
    const span = 1.1 + Math.abs(Math.sin(index / 5)) * 0.9;
    output.push({ timestamp: Date.UTC(2025, 0, 1) + index * interval, open, high: Math.max(open, close) + span, low: Math.min(open, close) - span, close, volume: 1000 + index * 2 + Math.abs(Math.sin(index / 7)) * 400 });
    previous = close;
  }
  return output;
}

test('replay configuration is bounded and deterministic', () => {
  const config = normalizeReplayConfig({ strategyId: 'mean_reversion', startingCapital: 50, riskPerTrade: 0.5, feeRate: -1, walkForwardFolds: 99 });
  assert.equal(config.strategyId, 'MEAN_REVERSION');
  assert.equal(config.startingCapital, 100);
  assert.equal(config.riskPerTrade, 0.1);
  assert.equal(config.feeRate, 0);
  assert.equal(config.walkForwardFolds, 12);
});

test('signal generator creates a complete indicator context', () => {
  const data = candles(350);
  const context = buildReplayContext(data);
  assert.equal(context.close.length, data.length);
  assert.equal(context.atr14.length, data.length);
  const signals = data.map((_, index) => generateSignal('MEAN_REVERSION', context, index)).filter(Boolean);
  assert.ok(signals.length > 0);
  assert.ok(signals.every(signal => ['LONG', 'SHORT'].includes(signal.direction)));
});

test('trade simulator executes deterministic entries and exits with fees', () => {
  const simulation = simulateTrades(candles(), { strategyId: 'MEAN_REVERSION', startingCapital: 10000, riskPerTrade: 0.01, feeRate: 0.001, slippageRate: 0.0005, stopAtr: 1.5, targetAtr: 2.2, maximumHoldingBars: 30 });
  assert.equal(simulation.available, true);
  assert.ok(simulation.trades.length > 3);
  assert.ok(simulation.equity.length > 500);
  assert.ok(simulation.trades.every(trade => Number.isFinite(trade.pnl) && trade.fees >= 0));
  assert.ok(simulation.trades.every(trade => ['STOP', 'TARGET', 'TIME', 'END'].includes(trade.exitReason)));
});

test('performance metrics quantify return, drawdown, expectancy, and streaks', () => {
  const simulation = simulateTrades(candles(), { strategyId: 'MEAN_REVERSION', maximumHoldingBars: 30 });
  const metrics = calculateReplayMetrics(simulation, { barsPerYear: 8760 });
  assert.equal(metrics.available, true);
  assert.equal(metrics.tradeCount, simulation.trades.length);
  assert.ok(Number.isFinite(metrics.totalReturn));
  assert.ok(metrics.maximumDrawdown <= 0);
  assert.ok(metrics.winRate >= 0 && metrics.winRate <= 1);
  assert.ok(metrics.feesPaid >= 0);
});

test('walk-forward results use separated chronological folds', () => {
  const data = candles(1200);
  const result = walkForwardReplay(data, { strategyId: 'MEAN_REVERSION', walkForwardFolds: 4, maximumHoldingBars: 30 }, { barsPerYear: 8760 });
  assert.equal(result.foldCount, 4);
  assert.equal(result.folds.length, 4);
  assert.ok(result.folds.every((fold, index) => fold.fold === index + 1));
  assert.ok(result.consistency >= 0 && result.consistency <= 1);
});

test('replay engine returns export-ready trades, equity, and walk-forward metrics', () => {
  const result = runReplay({
    asset: { id: 'btc-usd', symbol: 'BTC/USD', name: 'Bitcoin' }, timeframeId: '1h',
    candles: candles(), source: { source: 'fixture' }, config: { strategyId: 'MEAN_REVERSION', maximumHoldingBars: 30 }
  });
  assert.equal(result.available, true);
  assert.equal(result.asset.id, 'btc-usd');
  assert.ok(result.metrics.tradeCount > 0);
  assert.ok(result.walkForward.foldCount >= 2);
});
