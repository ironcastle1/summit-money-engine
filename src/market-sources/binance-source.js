import { UpstreamError } from '../core/errors.js';
import { normalizeCandles } from '../domain/markets/candle-schema.js';
import { timeframe } from '../domain/markets/timeframes.js';
import { BaseMarketSource } from './base-market-source.js';

export class BinanceSource extends BaseMarketSource {
  constructor(options) {
    super({
      ...options,
      id: 'binance',
      name: 'Binance Spot',
      configured: options.enabled !== false,
      supportedAssetClasses: ['crypto'],
      quoteTtlMs: 10_000,
      candleTtlMs: 30_000
    });
    this.baseUrl = String(options.baseUrl || 'https://api.binance.com').replace(/\/$/, '');
  }

  supports(asset, operation, timeframeId) {
    if (!super.supports(asset, operation, timeframeId)) return false;
    if (operation === 'candles') return Boolean(timeframe(timeframeId).binance);
    return true;
  }

  async fetchQuote(asset) {
    const mapping = asset.sources.binance;
    const url = new URL('/api/v3/ticker/24hr', this.baseUrl);
    url.searchParams.set('symbol', mapping.symbol);
    const data = await this.http.json(url, { upstream: this.id, attempts: 2 });
    const price = Number(data.lastPrice);
    if (!Number.isFinite(price) || price <= 0) throw new UpstreamError('Binance returned an invalid quote', { upstream: this.id });
    return {
      assetId: asset.id,
      symbol: asset.symbol,
      price,
      open24h: Number(data.openPrice) || null,
      high24h: Number(data.highPrice) || null,
      low24h: Number(data.lowPrice) || null,
      change24h: Number(data.priceChangePercent) / 100,
      baseVolume24h: Number(data.volume) || null,
      quoteVolume24h: Number(data.quoteVolume) || null,
      bid: Number(data.bidPrice) || null,
      ask: Number(data.askPrice) || null,
      quoteCurrency: mapping.quoteCurrency || asset.quoteCurrency,
      marketTime: Number(data.closeTime) || Date.now(),
      receivedAt: new Date().toISOString()
    };
  }

  async fetchCandles(asset, timeframeId, limit) {
    const mapping = asset.sources.binance;
    const definition = timeframe(timeframeId);
    const url = new URL('/api/v3/klines', this.baseUrl);
    url.searchParams.set('symbol', mapping.symbol);
    url.searchParams.set('interval', definition.binance);
    url.searchParams.set('limit', String(Math.min(1000, Math.max(50, limit))));
    const rows = await this.http.json(url, { upstream: this.id, attempts: 2 });
    if (!Array.isArray(rows)) throw new UpstreamError('Binance returned invalid candle data', { upstream: this.id });
    return normalizeCandles(rows.map(row => ({
      timestamp: row[0], open: row[1], high: row[2], low: row[3], close: row[4], volume: row[5]
    })));
  }
}
