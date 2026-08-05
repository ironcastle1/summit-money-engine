function finiteNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

export class CoinbasePublicConnector {
  constructor(options = {}) {
    this.http = options.http;
    this.baseUrl = String(options.baseUrl || 'https://api.exchange.coinbase.com').replace(/\/$/, '');
    this.products = options.products || ['BTC-USD', 'ETH-USD', 'SOL-USD'];
  }

  async fetch() {
    const records = [];
    for (const product of this.products) {
      const payload = await this.http.json(`${this.baseUrl}/products/${encodeURIComponent(product)}/ticker`, {
        upstream: 'coinbase-public',
        attempts: 2,
        timeoutMs: 8_000
      });
      records.push({
        product,
        price: finiteNumber(payload.price),
        bid: finiteNumber(payload.bid),
        ask: finiteNumber(payload.ask),
        volume: finiteNumber(payload.volume),
        tradeId: payload.trade_id || null,
        observedAt: payload.time || new Date().toISOString(),
        source: 'Coinbase Exchange'
      });
    }
    return {
      records: records.filter(record => record.price !== null),
      observedAt: records.at(-1)?.observedAt || new Date().toISOString(),
      metadata: { products: records.length }
    };
  }
}

export class BinancePublicConnector {
  constructor(options = {}) {
    this.http = options.http;
    this.baseUrl = String(options.baseUrl || 'https://api.binance.com').replace(/\/$/, '');
    this.symbols = options.symbols || ['BTCUSDT', 'ETHUSDT', 'SOLUSDT'];
  }

  async fetch() {
    const url = new URL(`${this.baseUrl}/api/v3/ticker/24hr`);
    url.searchParams.set('symbols', JSON.stringify(this.symbols));
    const payload = await this.http.json(url, {
      upstream: 'binance-public',
      attempts: 2,
      timeoutMs: 8_000
    });
    const rows = Array.isArray(payload) ? payload : [payload];
    const records = rows.map(row => ({
      symbol: String(row.symbol || ''),
      price: finiteNumber(row.lastPrice),
      changePercent24h: finiteNumber(row.priceChangePercent),
      quoteVolume24h: finiteNumber(row.quoteVolume),
      bid: finiteNumber(row.bidPrice),
      ask: finiteNumber(row.askPrice),
      observedAt: Number.isFinite(Number(row.closeTime))
        ? new Date(Number(row.closeTime)).toISOString()
        : new Date().toISOString(),
      source: 'Binance'
    })).filter(record => record.symbol && record.price !== null);
    return {
      records,
      observedAt: records.at(-1)?.observedAt || new Date().toISOString(),
      metadata: { symbols: records.length }
    };
  }
}
