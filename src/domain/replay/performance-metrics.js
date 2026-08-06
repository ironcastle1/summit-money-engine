import { round } from '../../core/numbers.js';

function average(values) { return values.length ? values.reduce((a, b) => a + b, 0) / values.length : null; }
function standardDeviation(values) {
  if (values.length < 2) return null;
  const mean = average(values);
  return Math.sqrt(values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / (values.length - 1));
}
function downsideDeviation(values) {
  const negative = values.filter(value => value < 0);
  if (!negative.length) return 0;
  return Math.sqrt(negative.reduce((sum, value) => sum + value ** 2, 0) / negative.length);
}
function streak(trades, predicate) {
  let current = 0;
  let maximum = 0;
  for (const trade of trades) {
    current = predicate(trade) ? current + 1 : 0;
    maximum = Math.max(maximum, current);
  }
  return maximum;
}

export function calculateReplayMetrics(simulation, options = {}) {
  if (!simulation?.available) return { available: false, reason: simulation?.reason || 'NO_SIMULATION' };
  const trades = simulation.trades || [];
  const wins = trades.filter(trade => trade.pnl > 0);
  const losses = trades.filter(trade => trade.pnl < 0);
  const returns = trades.map(trade => trade.returnOnCapital).filter(Number.isFinite);
  const grossProfit = wins.reduce((sum, trade) => sum + trade.pnl, 0);
  const grossLoss = Math.abs(losses.reduce((sum, trade) => sum + trade.pnl, 0));
  const netProfit = trades.reduce((sum, trade) => sum + trade.pnl, 0);
  const maxDrawdown = Math.min(0, ...simulation.equity.map(point => point.drawdown || 0));
  const meanReturn = average(returns);
  const deviation = standardDeviation(returns);
  const downside = downsideDeviation(returns);
  const barsPerYear = Number(options.barsPerYear) || 365 * 24;
  const tradesPerYear = trades.length && simulation.candles.length ? trades.length * barsPerYear / simulation.candles.length : 0;
  const annualisation = Math.sqrt(Math.max(1, tradesPerYear));
  const totalReturn = simulation.startingCapital > 0 ? simulation.endingCapital / simulation.startingCapital - 1 : null;
  const expectancy = trades.length ? netProfit / trades.length : null;
  const averageWin = average(wins.map(trade => trade.pnl));
  const averageLoss = average(losses.map(trade => Math.abs(trade.pnl)));
  return {
    available: true,
    tradeCount: trades.length,
    winCount: wins.length,
    lossCount: losses.length,
    flatCount: trades.length - wins.length - losses.length,
    winRate: trades.length ? round(wins.length / trades.length, 4) : null,
    totalReturn: Number.isFinite(totalReturn) ? round(totalReturn, 6) : null,
    netProfit: round(netProfit, 2),
    grossProfit: round(grossProfit, 2),
    grossLoss: round(grossLoss, 2),
    profitFactor: grossLoss > 0 ? round(grossProfit / grossLoss, 3) : grossProfit > 0 ? null : 0,
    expectancy: Number.isFinite(expectancy) ? round(expectancy, 2) : null,
    averageWin: Number.isFinite(averageWin) ? round(averageWin, 2) : null,
    averageLoss: Number.isFinite(averageLoss) ? round(averageLoss, 2) : null,
    payoffRatio: Number.isFinite(averageWin) && Number.isFinite(averageLoss) && averageLoss > 0 ? round(averageWin / averageLoss, 3) : null,
    maximumDrawdown: round(maxDrawdown, 6),
    recoveryFactor: maxDrawdown < 0 && Number.isFinite(totalReturn) ? round(totalReturn / Math.abs(maxDrawdown), 3) : null,
    sharpe: Number.isFinite(meanReturn) && Number.isFinite(deviation) && deviation > 0 ? round(meanReturn / deviation * annualisation, 3) : null,
    sortino: Number.isFinite(meanReturn) && Number.isFinite(downside) && downside > 0 ? round(meanReturn / downside * annualisation, 3) : null,
    averageBarsHeld: trades.length ? round(average(trades.map(trade => trade.barsHeld)), 1) : null,
    longestWinStreak: streak(trades, trade => trade.pnl > 0),
    longestLossStreak: streak(trades, trade => trade.pnl < 0),
    feesPaid: round(trades.reduce((sum, trade) => sum + trade.fees, 0), 2),
    endingCapital: simulation.endingCapital,
    startingCapital: simulation.startingCapital
  };
}
