import { mean, round, standardDeviation } from './numbers.js';
export function simpleReturn(start, end) {
  const first = Number(start); const last = Number(end);
  return Number.isFinite(first) && first !== 0 && Number.isFinite(last) ? last / first - 1 : 0;
}
export function logReturn(start, end) {
  const first = Number(start); const last = Number(end);
  return first > 0 && last > 0 ? Math.log(last / first) : 0;
}
export function returnSeries(prices = []) {
  const values = prices.map(Number).filter(value => Number.isFinite(value) && value > 0);
  return values.slice(1).map((value, index) => logReturn(values[index], value));
}
export function annualizedReturn(prices = [], periodsPerYear = 252) {
  if (prices.length < 2) return 0;
  const total = simpleReturn(prices[0], prices.at(-1));
  return round((1 + total) ** (periodsPerYear / Math.max(1, prices.length - 1)) - 1, 6);
}
export function annualizedVolatility(prices = [], periodsPerYear = 252) {
  return round(standardDeviation(returnSeries(prices)) * Math.sqrt(periodsPerYear), 6);
}
export function sharpeRatio(prices = [], riskFreeAnnual = 0, periodsPerYear = 252) {
  const returns = returnSeries(prices);
  const deviation = standardDeviation(returns);
  if (!deviation) return 0;
  return round((mean(returns) - riskFreeAnnual / periodsPerYear) / deviation * Math.sqrt(periodsPerYear), 4);
}
