const { getJson } = require('../utils/http');

const KEYWORDS = [
  'election','fed','interest','rate','inflation','war','ceasefire','oil','iran','israel','ukraine','russia','china','tariff','recession','bitcoin','crypto','ai','nvidia','tesla','weather','hurricane','shipping','suez','red sea','trump','eu','nato'
];

function scoreMarket(m) {
  const text = `${m.question || ''} ${m.title || ''} ${m.description || ''}`.toLowerCase();
  let score = 0;
  for (const k of KEYWORDS) if (text.includes(k)) score += 12;
  const vol = Number(m.volume || m.volumeNum || 0);
  const liq = Number(m.liquidity || m.liquidityNum || 0);
  if (vol > 100000) score += 30; else if (vol > 10000) score += 15;
  if (liq > 50000) score += 25; else if (liq > 5000) score += 12;
  return score;
}

function normalizeMarket(m) {
  const outcomes = (() => { try { return JSON.parse(m.outcomes || '[]'); } catch { return []; } })();
  const prices = (() => { try { return JSON.parse(m.outcomePrices || '[]'); } catch { return []; } })();
  return {
    id: m.id,
    question: m.question || m.title || 'Untitled market',
    slug: m.slug,
    url: m.slug ? `https://polymarket.com/event/${m.slug}` : 'https://polymarket.com',
    category: m.category || 'event',
    volume: Number(m.volume || m.volumeNum || 0),
    liquidity: Number(m.liquidity || m.liquidityNum || 0),
    endDate: m.endDate || m.end_date || null,
    outcomes: outcomes.map((o, i) => ({ name: o, price: Number(prices[i] || 0) })),
    score: scoreMarket(m)
  };
}

async function fetchPolymarketEvents() {
  const url = 'https://gamma-api.polymarket.com/markets?active=true&closed=false&limit=80&order=volume&ascending=false';
  const data = await getJson(url);
  const markets = Array.isArray(data) ? data : (data?.markets || []);
  return markets.map(normalizeMarket).filter(m => m.score >= 12).sort((a,b)=>b.score-a.score).slice(0, 30);
}

module.exports = { fetchPolymarketEvents };
