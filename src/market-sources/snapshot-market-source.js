import { BaseMarketSource } from './base-market-source.js';

function snapshotCandle(quote, timestamp) {
  const price = Number(quote.price);
  const change = Number(quote.change24h);
  const open = Number.isFinite(change) && Math.abs(1 + change) > 0.000001 ? price / (1 + change) : price;
  return {
    timestamp: timestamp - 86_400_000,
    open,
    high: Number.isFinite(Number(quote.high24h)) ? Number(quote.high24h) : Math.max(open, price),
    low: Number.isFinite(Number(quote.low24h)) ? Number(quote.low24h) : Math.min(open, price),
    close: price,
    volume: 0
  };
}

export class SnapshotMarketSource extends BaseMarketSource {
  constructor(options = {}) {
    super({ ...options, id: 'snapshot-market', name: 'Local market snapshot', configured: true, supportedAssetClasses: ['crypto'], quoteTtlMs: 86_400_000, candleTtlMs: 86_400_000, staleMs: 31_536_000_000 });
    this.snapshot = options.snapshot || { quotes: {}, generatedAt: new Date(0).toISOString() };
  }
  supports(asset) { return asset.assetClass === 'crypto' && Boolean(this.snapshot.quotes?.[asset.id]); }
  async fetchQuote(asset) {
    const row = this.snapshot.quotes[asset.id];
    return {
      assetId: asset.id, symbol: asset.symbol, price: Number(row.price),
      change24h: Number.isFinite(Number(row.change24h)) ? Number(row.change24h) : null,
      high24h: Number.isFinite(Number(row.high24h)) ? Number(row.high24h) : null,
      low24h: Number.isFinite(Number(row.low24h)) ? Number(row.low24h) : null,
      quoteVolume24h: null, quoteCurrency: asset.quoteCurrency || 'USD',
      marketTime: Date.parse(this.snapshot.generatedAt) || Date.now(), receivedAt: new Date().toISOString(), snapshot: true
    };
  }
  async fetchCandles(asset) {
    const quote = this.snapshot.quotes[asset.id];
    const timestamp = Date.parse(this.snapshot.generatedAt) || Date.now();
    return [snapshotCandle(quote, timestamp)];
  }
}
