import test from 'node:test';
import assert from 'node:assert/strict';
import { TtlCache } from '../../src/infra/cache/ttl-cache.js';
import { BinanceSource } from '../../src/market-sources/binance-source.js';
import { CoinGeckoSource } from '../../src/market-sources/coingecko-source.js';
import { CoinbaseExchangeSource } from '../../src/market-sources/coinbase-exchange-source.js';
import { AlphaVantageSource } from '../../src/market-sources/alpha-vantage-source.js';
import { MarketSourceRegistry } from '../../src/market-sources/market-source-registry.js';
import { normalizeAsset } from '../../src/domain/markets/asset-schema.js';

const logger = { child() { return this; }, warn() {}, debug() {} };
const cache = new TtlCache({ maxEntries: 100 });
const crypto = normalizeAsset({ id: 'btc-usd', symbol: 'BTC', name: 'Bitcoin', assetClass: 'crypto', baseCurrency: 'BTC', quoteCurrency: 'USD', sources: { binance: { symbol: 'BTCUSDT' }, coingecko: { symbol: 'bitcoin' }, 'coinbase-exchange': { symbol: 'BTC-USD' } } });
const equity = normalizeAsset({ id: 'aapl', symbol: 'AAPL', name: 'Apple', assetClass: 'equity', baseCurrency: 'AAPL', quoteCurrency: 'USD', sources: { alphavantage: { symbol: 'AAPL' } } });

test('Binance source parses quote and candle payloads', async () => {
  const http = { async json(url) {
    if (String(url).includes('ticker')) return { lastPrice: '100', openPrice: '90', highPrice: '110', lowPrice: '80', priceChangePercent: '11.11', volume: '5', quoteVolume: '500', bidPrice: '99', askPrice: '101', closeTime: 1234 };
    return [[1000, '90', '105', '85', '100', '10'], [2000, '100', '115', '95', '110', '12']];
  } };
  const source = new BinanceSource({ http, cache, logger, enabled: true });
  const quote = await source.fetchQuote(crypto);
  const candles = await source.fetchCandles(crypto, '1h', 100);
  assert.equal(quote.price, 100);
  assert.equal(candles.length, 2);
  assert.equal(candles[1].close, 110);
});

test('CoinGecko source parses simple price and historical points', async () => {
  const http = { async json(url) {
    if (String(url).includes('simple/price')) return { bitcoin: { usd: 100, usd_24h_change: 5, usd_24h_vol: 1000, last_updated_at: 100 } };
    return { prices: [[3_600_000, 90], [7_200_000, 100], [10_800_000, 110]] };
  } };
  const source = new CoinGeckoSource({ http, cache: new TtlCache({ maxEntries: 100 }), logger, enabled: true });
  assert.equal((await source.fetchQuote(crypto)).change24h, 0.05);
  assert.equal((await source.fetchCandles(crypto, '1h', 100)).length, 3);
});


test('Coinbase Exchange source parses public stats and candles', async () => {
  const rows = Array.from({ length: 160 }, (_, index) => [1_700_000_000 + index * 3600, 90 + index, 110 + index, 95 + index, 100 + index, 10 + index]);
  const http = { async json(url) { return String(url).includes('/stats') ? { last: '105', open: '100', high: '110', low: '90', volume: '12' } : rows; } };
  const source = new CoinbaseExchangeSource({ http, cache: new TtlCache({ maxEntries: 100 }), logger });
  const quote = await source.fetchQuote(crypto);
  const candles = await source.fetchCandles(crypto, '1h', 160);
  assert.equal(quote.price, 105);
  assert.ok(Math.abs(quote.change24h - 0.05) < 1e-9);
  assert.equal(candles.length, 160);
  assert.ok(candles[0].timestamp < candles.at(-1).timestamp);
});

test('Alpha Vantage source is not configured without a key', () => {
  const source = new AlphaVantageSource({ http: {}, cache, logger, apiKey: '' });
  assert.equal(source.health().state, 'NOT_CONFIGURED');
  assert.equal(source.supports(equity, 'quote'), false);
});

test('market registry falls back to the next supporting source', async () => {
  const first = { id: 'binance', supports: () => true, quote: async () => { throw Object.assign(new Error('off'), { code: 'OFF' }); }, health: () => ({}) };
  const second = { id: 'coingecko', supports: () => true, quote: async () => ({ value: { price: 100 }, sourceId: 'coingecko' }), health: () => ({}) };
  const registry = new MarketSourceRegistry({ logger }).register(first).register(second);
  const result = await registry.quote(crypto);
  assert.equal(result.sourceId, 'coingecko');
});
