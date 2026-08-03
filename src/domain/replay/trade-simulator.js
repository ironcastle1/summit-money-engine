import { clamp, round } from '../../core/numbers.js';
import { buildReplayContext, generateSignal } from './signal-generator.js';
import { normalizeReplayConfig } from './strategy-schema.js';

function executionPrice(price, direction, slippageRate, entering) {
  const adverse = entering ? (direction === 'LONG' ? 1 : -1) : (direction === 'LONG' ? -1 : 1);
  return price * (1 + adverse * slippageRate);
}

function positionSize(capital, riskPerTrade, entryPrice, stopPrice) {
  const riskBudget = capital * riskPerTrade;
  const unitRisk = Math.abs(entryPrice - stopPrice);
  if (!Number.isFinite(unitRisk) || unitRisk <= 0) return 0;
  return Math.max(0, riskBudget / unitRisk);
}

function exitDecision(trade, candle, barsHeld, config) {
  const isLong = trade.direction === 'LONG';
  const stopHit = isLong ? candle.low <= trade.stopPrice : candle.high >= trade.stopPrice;
  const targetHit = isLong ? candle.high >= trade.targetPrice : candle.low <= trade.targetPrice;
  if (stopHit && targetHit) return { reason: 'STOP', price: trade.stopPrice };
  if (stopHit) return { reason: 'STOP', price: trade.stopPrice };
  if (targetHit) return { reason: 'TARGET', price: trade.targetPrice };
  if (barsHeld >= config.maximumHoldingBars) return { reason: 'TIME', price: candle.close };
  return null;
}

function closeTrade(trade, decision, candle, capital, config) {
  const exitPrice = executionPrice(decision.price, trade.direction, config.slippageRate, false);
  const gross = trade.direction === 'LONG' ? (exitPrice - trade.entryPrice) * trade.quantity : (trade.entryPrice - exitPrice) * trade.quantity;
  const entryNotional = trade.entryPrice * trade.quantity;
  const exitNotional = exitPrice * trade.quantity;
  const fees = (entryNotional + exitNotional) * config.feeRate;
  const pnl = gross - fees;
  const returnOnCapital = capital > 0 ? pnl / capital : 0;
  return {
    ...trade,
    exitIndex: candle.index,
    exitAt: new Date(candle.timestamp).toISOString(),
    exitPrice: round(exitPrice, 8),
    exitReason: decision.reason,
    barsHeld: candle.index - trade.entryIndex,
    grossPnl: round(gross, 4),
    fees: round(fees, 4),
    pnl: round(pnl, 4),
    returnOnCapital: round(returnOnCapital, 6),
    rMultiple: trade.initialRisk > 0 ? round(pnl / trade.initialRisk, 4) : null
  };
}

export function simulateTrades(rawCandles, inputConfig = {}) {
  const config = normalizeReplayConfig(inputConfig);
  const candles = rawCandles.map((candle, index) => ({ ...candle, index }));
  if (candles.length < config.minimumBars) return { available: false, reason: 'INSUFFICIENT_HISTORY', candleCount: candles.length, requiredCandleCount: config.minimumBars, config };
  const context = buildReplayContext(candles);
  let capital = config.startingCapital;
  let openTrade = null;
  const trades = [];
  const equity = [{ index: 0, timestamp: candles[0].timestamp, equity: capital, drawdown: 0 }];
  let peak = capital;
  let skippedSignals = 0;

  for (let index = 100; index < candles.length; index += 1) {
    const candle = candles[index];
    if (openTrade) {
      const decision = exitDecision(openTrade, candle, index - openTrade.entryIndex, config);
      if (decision) {
        const closed = closeTrade(openTrade, decision, candle, capital, config);
        capital = Math.max(0, capital + closed.pnl);
        trades.push(closed);
        openTrade = null;
      }
    }
    if (!openTrade && index < candles.length - 1 && capital > 0) {
      const signal = generateSignal(config.strategyId, context, index);
      if (signal && (signal.direction !== 'SHORT' || config.allowShort)) {
        const next = candles[index + 1];
        const atrValue = context.atr14[index];
        if (Number.isFinite(atrValue) && atrValue > 0) {
          const entryPrice = executionPrice(next.open, signal.direction, config.slippageRate, true);
          const stopDistance = atrValue * config.stopAtr;
          const targetDistance = atrValue * config.targetAtr;
          const stopPrice = signal.direction === 'LONG' ? entryPrice - stopDistance : entryPrice + stopDistance;
          const targetPrice = signal.direction === 'LONG' ? entryPrice + targetDistance : entryPrice - targetDistance;
          const quantity = positionSize(capital, config.riskPerTrade, entryPrice, stopPrice);
          const maximumAffordable = capital / entryPrice;
          const finalQuantity = Math.min(quantity, maximumAffordable * 3);
          if (finalQuantity > 0) {
            openTrade = {
              id: `${config.strategyId}-${next.timestamp}-${signal.direction}`,
              direction: signal.direction,
              signalStrength: round(signal.strength, 1),
              signalIndex: index,
              signalAt: new Date(candle.timestamp).toISOString(),
              entryIndex: index + 1,
              entryAt: new Date(next.timestamp).toISOString(),
              entryPrice: round(entryPrice, 8),
              stopPrice: round(stopPrice, 8),
              targetPrice: round(targetPrice, 8),
              quantity: round(finalQuantity, 8),
              initialRisk: round(Math.abs(entryPrice - stopPrice) * finalQuantity, 4),
              capitalBefore: round(capital, 4)
            };
          } else skippedSignals += 1;
        } else skippedSignals += 1;
      }
    }
    peak = Math.max(peak, capital);
    equity.push({
      index,
      timestamp: candle.timestamp,
      equity: round(capital, 4),
      drawdown: peak > 0 ? round((capital - peak) / peak, 6) : 0
    });
  }
  if (openTrade) {
    const last = candles.at(-1);
    const closed = closeTrade(openTrade, { reason: 'END', price: last.close }, last, capital, config);
    capital = Math.max(0, capital + closed.pnl);
    trades.push(closed);
  }
  return { available: true, config, candles, trades, equity, startingCapital: config.startingCapital, endingCapital: round(capital, 4), skippedSignals };
}
