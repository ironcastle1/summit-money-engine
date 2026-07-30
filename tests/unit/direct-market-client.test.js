import test from 'node:test';
import assert from 'node:assert/strict';
import { createDirectMarketData } from '../../public/markets/direct-market-data.js';

function response(payload, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: async () => payload };
}

test('direct market fallback returns quotes and empirical history without fabricated probabilities', async () => {
  const originalFetch = globalThis.fetch;
  const now = Date.now() - 720 * 3_600_000;
  const prices = Array.from({ length: 721 }, (_, index) => {
    const timestamp = now + index * 3_600_000;
    const price = 50_000 + index * 12 + Math.sin(index / 8) * 450;
    return [timestamp, price];
  });
  const volumes = prices.map(([timestamp], index) => [timestamp, 10_000_000 + index * 10_000]);
  globalThis.fetch = async input => {
    const url = String(input);
    if (url.includes('/simple/price')) return response({ bitcoin: { usd: 64_000, usd_24h_change: 1.25, usd_24h_vol: 20_000_000_000, last_updated_at: Math.floor(Date.now() / 1000) } });
    if (url.includes('/market_chart')) return response({ prices, total_volumes: volumes });
    return response({}, 404);
  };
  try {
    const fallback = createDirectMarketData({ catalog: () => [{ id: 'btc-usd', symbol: 'BTC', name: 'Bitcoin', assetClass: 'crypto', quoteCurrency: 'USD' }] });
    const screener = await fallback.screener({ assets: ['btc-usd'], timeframe: '1h' });
    assert.equal(screener.results[0].quote.price, 64_000);
    assert.equal(screener.sourceHealth['coingecko-direct'].state, 'ONLINE');
    const analysis = await fallback.analysis({ asset: 'btc-usd', timeframe: '1h' });
    assert.equal(analysis.available, true);
    assert.equal(analysis.model, 'EMPIRICAL_HISTORY');
    assert.ok(analysis.candles.length >= 700);
    assert.ok(Number.isFinite(analysis.outcomes[0].riseProbability));
    assert.ok(analysis.outcomes[0].sampleSize > 600);
    assert.equal(analysis.source.candles.id, 'coingecko-direct');
  } finally {
    globalThis.fetch = originalFetch;
  }
});
