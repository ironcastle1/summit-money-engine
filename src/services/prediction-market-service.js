import { clamp, round } from '../core/numbers.js';

function parseJsonArray(value) {
  if (Array.isArray(value)) return value;
  try { return JSON.parse(value); } catch { return []; }
}

function normalizeMarket(row) {
  const outcomes = parseJsonArray(row.outcomes);
  const prices = parseJsonArray(row.outcomePrices).map(Number);
  const pairs = outcomes.map((outcome, index) => ({ outcome: String(outcome), probability: Number.isFinite(prices[index]) ? clamp(prices[index], 0, 1) : null }));
  const probability = pairs.find(item => item.outcome.toLowerCase() === 'yes')?.probability ?? pairs[0]?.probability ?? null;
  return {
    id: String(row.id || row.conditionId || row.slug),
    slug: String(row.slug || ''),
    question: String(row.question || row.title || '').trim(),
    category: String(row.category || row.groupItemTitle || 'other').trim().toLowerCase(),
    probability: Number.isFinite(probability) ? round(probability, 6) : null,
    outcomes: pairs,
    volume: Number(row.volumeNum ?? row.volume) || 0,
    liquidity: Number(row.liquidityNum ?? row.liquidity) || 0,
    change24h: Number(row.oneDayPriceChange) || null,
    endDate: row.endDate || row.endDateIso || null,
    active: row.active !== false,
    closed: Boolean(row.closed),
    url: row.slug ? `https://polymarket.com/event/${row.slug}` : null,
    updatedAt: row.updatedAt || null
  };
}

export class PredictionMarketService {
  constructor(options) {
    this.http = options.http;
    this.cache = options.cache;
    this.baseUrl = String(options.baseUrl || 'https://gamma-api.polymarket.com').replace(/\/$/, '');
  }

  async list(options = {}) {
    const limit = Math.min(100, Math.max(1, options.limit || 40));
    const cacheKey = `prediction:polymarket:${limit}:${options.search || ''}`;
    const result = await this.cache.getOrLoad(cacheKey, { ttlMs: 45_000, staleMs: 600_000 }, async () => {
      const url = new URL(`${this.baseUrl}/markets`);
      url.searchParams.set('active', 'true');
      url.searchParams.set('closed', 'false');
      url.searchParams.set('limit', String(Math.min(100, Math.max(limit * 2, 50))));
      url.searchParams.set('order', 'volume24hr');
      url.searchParams.set('ascending', 'false');
      const rows = await this.http.json(url, { upstream: 'polymarket', attempts: 2 });
      return (Array.isArray(rows) ? rows : []).map(normalizeMarket).filter(market => market.question);
    });
    const search = String(options.search || '').trim().toLowerCase();
    const markets = result.value
      .filter(market => !search || `${market.question} ${market.category}`.toLowerCase().includes(search))
      .sort((a, b) => b.volume - a.volume)
      .slice(0, limit);
    return { markets, source: { id: 'polymarket', cache: result.cache, stale: result.cache === 'STALE' }, generatedAt: new Date().toISOString() };
  }
}
