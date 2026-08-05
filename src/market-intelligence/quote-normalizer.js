import { finite, round } from './numbers.js';
import { freshnessState, toIso } from './time.js';
export function normalizeQuote(input, asset = {}) {
  if (!input || typeof input !== 'object') return null;
  const price = finite(input.price ?? input.last ?? input.close ?? input.value, NaN);
  if (!Number.isFinite(price) || price <= 0) return null;
  const previous = finite(input.previousClose ?? input.prevClose, NaN);
  const change = Number.isFinite(Number(input.change)) ? Number(input.change) : Number.isFinite(previous) ? price - previous : 0;
  const changePercent = Number.isFinite(Number(input.changePercent ?? input.changePct))
    ? Number(input.changePercent ?? input.changePct)
    : previous > 0 ? change / previous * 100 : 0;
  const updatedAt = toIso(input.updatedAt ?? input.timestamp ?? input.time ?? Date.now());
  return Object.freeze({
    assetId: String(asset.id || input.assetId || input.symbol || ''), symbol: String(asset.symbol || input.symbol || ''),
    price: round(price, 8), open: round(finite(input.open, price), 8), high: round(finite(input.high, price), 8),
    low: round(finite(input.low, price), 8), previousClose: Number.isFinite(previous) ? round(previous, 8) : null,
    change: round(change, 8), changePercent: round(changePercent, 4), volume: Math.max(0, finite(input.volume, 0)),
    marketCap: Math.max(0, finite(input.marketCap, 0)), currency: String(input.currency || asset.currency || 'USD').toUpperCase(),
    updatedAt, freshness: freshnessState(updatedAt)
  });
}
