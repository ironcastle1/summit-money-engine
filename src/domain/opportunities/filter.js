import { DEFAULT_OPPORTUNITY_FILTERS } from './constants.js';

function arraySet(value, fallback) {
  const source = Array.isArray(value) && value.length ? value : fallback;
  return new Set(source.map(item => String(item).toUpperCase()));
}

export function filterOpportunities(opportunities, input = {}) {
  const filters = { ...DEFAULT_OPPORTUNITY_FILTERS, ...input };
  const kinds = arraySet(filters.kinds, DEFAULT_OPPORTUNITY_FILTERS.kinds);
  const directions = arraySet(filters.directions, DEFAULT_OPPORTUNITY_FILTERS.directions);
  const minimumScore = Number(filters.minimumScore);
  const minimumConfidence = Number(filters.minimumConfidence);
  const maximumRisk = Number(filters.maximumRisk);
  const minimumLiquidity = Number(filters.minimumLiquidity);
  const search = String(filters.search || '').trim().toLowerCase();
  const filtered = opportunities.filter(item => {
    if (!kinds.has(item.kind)) return false;
    if (!directions.has(item.direction)) return false;
    if (Number.isFinite(minimumScore) && (!Number.isFinite(item.score) || item.score < minimumScore)) return false;
    if (Number.isFinite(minimumConfidence) && (!Number.isFinite(item.confidence) || item.confidence < minimumConfidence)) return false;
    if (Number.isFinite(maximumRisk) && Number.isFinite(item.risk) && item.risk > maximumRisk) return false;
    if (Number.isFinite(minimumLiquidity) && Number.isFinite(item.liquidity) && item.liquidity < minimumLiquidity) return false;
    if (search) {
      const haystack = [item.title, item.subtitle, item.symbol, item.category, ...(item.tags || [])].join(' ').toLowerCase();
      if (!haystack.includes(search)) return false;
    }
    return true;
  });
  const limit = Math.max(1, Math.min(200, Number(filters.limit) || 50));
  return filtered.slice(0, limit);
}
