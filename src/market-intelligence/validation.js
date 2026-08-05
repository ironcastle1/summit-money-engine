import { DEFAULT_HISTORY_LIMIT, DEFAULT_SCREEN_LIMIT, DEFAULT_TIMEFRAME, MAX_SCREEN_LIMIT } from './constants.js';
function list(value, maximum = 100) {
  if (Array.isArray(value)) return value.slice(0, maximum);
  if (value === undefined || value === null || value === '') return [];
  return String(value).split(',').map(item => item.trim()).filter(Boolean).slice(0, maximum);
}
export function normalizeSnapshotRequest(input = {}) {
  const stringAssets = Array.isArray(input.assets) && input.assets.every(item => typeof item === 'string') ? input.assets : [];
  return Object.freeze({
    assetIds: list(input.assetIds?.length ? input.assetIds : stringAssets, 120).map(String),
    timeframe: String(input.timeframe || DEFAULT_TIMEFRAME).toLowerCase(),
    historyLimit: Math.min(1000, Math.max(20, Number(input.historyLimit) || DEFAULT_HISTORY_LIMIT)),
    includeEvents: input.includeEvents !== false,
    includePredictions: input.includePredictions !== false,
    includeLive: input.includeLive !== false,
    maximumAssets: Math.min(120, Math.max(1, Number(input.maximumAssets) || 30))
  });
}
export function normalizeScreenRequest(input = {}) {
  return Object.freeze({
    query: String(input.query || '').trim().slice(0, 160),
    assetClasses: list(input.assetClasses, 20).map(value => String(value).toUpperCase()),
    tags: list(input.tags, 30).map(value => String(value).toLowerCase()),
    regimes: list(input.regimes, 12).map(value => String(value).toUpperCase()),
    directions: list(input.directions, 5).map(value => String(value).toUpperCase()),
    minimumOpportunity: Math.max(0, Math.min(100, Number(input.minimumOpportunity) || 0)),
    maximumRisk: Math.max(0, Math.min(100, Number(input.maximumRisk) || 100)),
    minimumLiquidity: Math.max(0, Math.min(100, Number(input.minimumLiquidity) || 0)),
    minimumEvidence: String(input.minimumEvidence || 'D').toUpperCase(),
    sortBy: String(input.sortBy || 'opportunityScore'),
    sortDirection: String(input.sortDirection || 'desc').toLowerCase() === 'asc' ? 'asc' : 'desc',
    limit: Math.min(MAX_SCREEN_LIMIT, Math.max(1, Number(input.limit) || DEFAULT_SCREEN_LIMIT))
  });
}
export function normalizePosition(value = {}) {
  const symbol = String(value.symbol || value.assetId || '').trim();
  if (!symbol) throw new TypeError('Position symbol is required');
  const quantity = Number(value.quantity ?? value.units ?? 0);
  const marketValue = Number(value.marketValue ?? value.value ?? 0);
  if (!Number.isFinite(quantity) && !Number.isFinite(marketValue)) throw new TypeError(`Invalid position: ${symbol}`);
  return Object.freeze({
    symbol, assetId: String(value.assetId || symbol), quantity: Number.isFinite(quantity) ? quantity : 0,
    marketValue: Number.isFinite(marketValue) ? marketValue : 0,
    currency: String(value.currency || 'USD').toUpperCase(),
    tags: list(value.tags, 20).map(item => String(item).toLowerCase())
  });
}
