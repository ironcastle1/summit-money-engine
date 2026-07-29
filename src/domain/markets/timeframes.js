const DEFINITIONS = Object.freeze({
  '1m': { id: '1m', milliseconds: 60_000, annualisation: 525_600, binance: '1m', alphaVantage: '1min' },
  '5m': { id: '5m', milliseconds: 300_000, annualisation: 105_120, binance: '5m', alphaVantage: '5min' },
  '15m': { id: '15m', milliseconds: 900_000, annualisation: 35_040, binance: '15m', alphaVantage: '15min' },
  '30m': { id: '30m', milliseconds: 1_800_000, annualisation: 17_520, binance: '30m', alphaVantage: '30min' },
  '1h': { id: '1h', milliseconds: 3_600_000, annualisation: 8_760, binance: '1h', alphaVantage: '60min' },
  '4h': { id: '4h', milliseconds: 14_400_000, annualisation: 2_190, binance: '4h', alphaVantage: null },
  '1d': { id: '1d', milliseconds: 86_400_000, annualisation: 365, binance: '1d', alphaVantage: 'daily' },
  '1w': { id: '1w', milliseconds: 604_800_000, annualisation: 52, binance: '1w', alphaVantage: 'weekly' }
});

export const TIMEFRAME_IDS = Object.freeze(Object.keys(DEFINITIONS));
export const DEFAULT_ANALYSIS_TIMEFRAMES = Object.freeze(['15m', '1h', '4h', '1d']);

export function timeframe(id) {
  const value = DEFINITIONS[String(id || '').toLowerCase()];
  if (!value) throw new RangeError(`Unsupported timeframe: ${id}`);
  return value;
}

export function isTimeframe(id) {
  return Boolean(DEFINITIONS[String(id || '').toLowerCase()]);
}

export function barsForDuration(id, durationMs) {
  const definition = timeframe(id);
  return Math.max(1, Math.round(durationMs / definition.milliseconds));
}

export function horizonLabel(bars, id) {
  const milliseconds = bars * timeframe(id).milliseconds;
  if (milliseconds < 3_600_000) return `${Math.round(milliseconds / 60_000)}m`;
  if (milliseconds < 86_400_000) return `${Math.round(milliseconds / 3_600_000)}h`;
  return `${Math.round(milliseconds / 86_400_000)}d`;
}
