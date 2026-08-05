import { UpstreamError } from '../core/errors.js';
import { normalizeCandles } from '../domain/markets/candle-schema.js';
import { timeframe } from '../domain/markets/timeframes.js';
import { BaseMarketSource } from './base-market-source.js';

export class CoinGeckoSource extends BaseMarketSource {
  constructor(options) {
    super({ ...options, id: 'coingecko', name: 'CoinGecko', configured: options.enabled !== false, supportedAssetClasses: ['crypto'], quoteTtlMs: 30_000, candleTtlMs: 180_000 });
    this.baseUrl = String(options.baseUrl || 'https://api.coingecko.com/api/v3').replace(/\/$/, '');
    this.apiKey = options.apiKey || '';
  }

  supports(asset, operation, timeframeId) {
    if (!super.supports(asset, operation, timeframeId)) return false;
    if (operation === 'candles') return ['1h', '4h', '1d'].includes(timeframeId);
    return true;
  }

  headers() {
    return this.apiKey ? { 'x-cg-demo-api-key': this.apiKey } : {};
  }

  async fetchQuote(asset) {
    const mapping = asset.sources.coingecko;
    const currency = (mapping.quoteCurrency || asset.quoteCurrency || 'USD').toLowerCase();
    const url = new URL(`${this.baseUrl}/simple/price`);
    url.searchParams.set('ids', mapping.symbol);
    url.searchParams.set('vs_currencies', currency);
    url.searchParams.set('include_24hr_change', 'true');
    url.searchParams.set('include_24hr_vol', 'true');
    url.searchParams.set('include_last_updated_at', 'true');
    const data = await this.http.json(url, { upstream: this.id, headers: this.headers() });
    const row = data?.[mapping.symbol];
    const price = Number(row?.[currency]);
    if (!Number.isFinite(price) || price <= 0) throw new UpstreamError('CoinGecko returned an invalid quote', { upstream: this.id });
    return {
      assetId: asset.id,
      symbol: asset.symbol,
      price,
      change24h: Number(row?.[`${currency}_24h_change`]) / 100,
      quoteVolume24h: Number(row?.[`${currency}_24h_vol`]) || null,
      quoteCurrency: currency.toUpperCase(),
      marketTime: Number(row?.last_updated_at) * 1000 || Date.now(),
      receivedAt: new Date().toISOString()
    };
  }

  async fetchCandles(asset, timeframeId, limit) {
    const mapping = asset.sources.coingecko;
    const currency = (mapping.quoteCurrency || asset.quoteCurrency || 'USD').toLowerCase();
    const definition = timeframe(timeframeId);
    const requestedDays = Math.max(2, Math.ceil(limit * definition.milliseconds / 86_400_000));
    const maximumDays = timeframeId === '1d' ? 365 : 90;
    const url = new URL(`${this.baseUrl}/coins/${encodeURIComponent(mapping.symbol)}/market_chart`);
    url.searchParams.set('vs_currency', currency);
    url.searchParams.set('days', String(Math.min(maximumDays, requestedDays)));
    const data = await this.http.json(url, { upstream: this.id, headers: this.headers() });
    if (!Array.isArray(data?.prices)) throw new UpstreamError('CoinGecko returned invalid history', { upstream: this.id });
    const points = data.prices.map(([timestamp, price]) => ({ timestamp, price: Number(price) })).filter(point => Number.isFinite(point.price) && point.price > 0);
    const buckets = new Map();
    for (const point of points) {
      const timestamp = Math.floor(point.timestamp / definition.milliseconds) * definition.milliseconds;
      const bucket = buckets.get(timestamp) || { timestamp, open: point.price, high: point.price, low: point.price, close: point.price, volume: 0 };
      bucket.high = Math.max(bucket.high, point.price);
      bucket.low = Math.min(bucket.low, point.price);
      bucket.close = point.price;
      buckets.set(timestamp, bucket);
    }
    return normalizeCandles([...buckets.values()].sort((a, b) => a.timestamp - b.timestamp).slice(-limit));
  }
}
