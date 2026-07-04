const { performance } = require('perf_hooks');
const { fetchMarketPrices } = require('./marketService');
const { fetchPolymarketEvents } = require('./polymarketService');
const { fetchNews } = require('./newsService');
const { buildSignals } = require('../engines/signalEngine');
const { setState } = require('./stateService');

let running = false;

async function refreshAll(force = false) {
  if (running && !force) return;
  running = true;
  const t0 = performance.now();
  const notes = [];
  try {
    const [prices, predictionMarkets, news] = await Promise.all([
      fetchMarketPrices().catch(err => { notes.push(`markets: ${err.message}`); return []; }),
      fetchPolymarketEvents().catch(err => { notes.push(`polymarket: ${err.message}`); return []; }),
      fetchNews().catch(err => { notes.push(`news: ${err.message}`); return []; })
    ]);
    const signals = buildSignals({ prices, predictionMarkets, news });
    setState({
      prices,
      predictionMarkets,
      news,
      signals,
      engine: {
        status: 'live',
        lastRefreshMs: Math.round(performance.now() - t0),
        notes
      }
    });
  } finally {
    running = false;
  }
}

module.exports = { refreshAll };
