import { UpstreamError } from '../core/errors.js';
import { normalizeCandles } from '../domain/markets/candle-schema.js';
import { timeframe } from '../domain/markets/timeframes.js';
import { BaseMarketSource } from './base-market-source.js';

const GRANULARITY = Object.freeze({ '1m': 60, '5m': 300, '15m': 900, '1h': 3600, '1d': 86400 });

export class CoinbaseExchangeSource extends BaseMarketSource {
  constructor(options = {}) {
    super({ ...options, id: 'coinbase-exchange', name: 'Coinbase Exchange', configured: options.enabled !== false, supportedAssetClasses: ['crypto'], quoteTtlMs: 10_000, candleTtlMs: 30_000 });
    this.baseUrl = String(options.baseUrl || 'https://api.exchange.coinbase.com').replace(/\/$/, '');
  }

  supports(asset, operation, timeframeId) {
    if (!super.supports(asset, operation, timeframeId)) return false;
    return operation !== 'candles' || Boolean(GRANULARITY[timeframeId]);
  }

  async fetchQuote(asset) {
    const productId = asset.sources[this.id].symbol;
    const data = await this.http.json(`${this.baseUrl}/products/${encodeURIComponent(productId)}/stats`, { upstream: this.id, attempts: 2 });
    const price = Number(data.last);
    const open = Number(data.open);
    if (!Number.isFinite(price) || price <= 0) throw new UpstreamError('Coinbase returned an invalid quote', { upstream: this.id });
    return {
      assetId: asset.id,
      symbol: asset.symbol,
      price,
      open24h: Number.isFinite(open) ? open : null,
      high24h: Number(data.high) || null,
      low24h: Number(data.low) || null,
      change24h: Number.isFinite(open) && open > 0 ? price / open - 1 : null,
      baseVolume24h: Number(data.volume) || null,
      quoteVolume24h: null,
      quoteCurrency: asset.quoteCurrency || 'USD',
      marketTime: Date.now(),
      receivedAt: new Date().toISOString()
    };
  }

  async fetchCandles(asset, timeframeId, limit) {
    const productId = asset.sources[this.id].symbol;
    const definition = timeframe(timeframeId);
    const granularity = GRANULARITY[timeframeId];
    const requested = Math.min(300, Math.max(140, Number(limit) || 300));
    const end = Math.floor(Date.now() / 1000);
    const start = end - requested * granularity;
    const url = new URL(`${this.baseUrl}/products/${encodeURIComponent(productId)}/candles`);
    url.searchParams.set('granularity', String(granularity));
    url.searchParams.set('start', new Date(start * 1000).toISOString());
    url.searchParams.set('end', new Date(end * 1000).toISOString());
    const rows = await this.http.json(url, { upstream: this.id, attempts: 2 });
    if (!Array.isArray(rows)) throw new UpstreamError('Coinbase returned invalid candle data', { upstream: this.id });
    const candles = rows.map(row => ({ timestamp: Number(row[0]) * 1000, low: row[1], high: row[2], open: row[3], close: row[4], volume: row[5] }));
    const normalized = normalizeCandles(candles).slice(-requested);
    if (normalized.length < Math.min(80, requested)) throw new UpstreamError('Coinbase returned insufficient candle history', { upstream: this.id, details: { timeframeId, received: normalized.length, requested } });
    return normalized;
  }
}
