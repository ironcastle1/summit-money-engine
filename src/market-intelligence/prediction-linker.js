import { clamp, round } from './numbers.js';
function tokens(value) {
  return new Set(String(value || '').toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(term => term.length >= 3));
}
function similarity(left, right) {
  const a = tokens(left); const b = tokens(right); if (!a.size || !b.size) return 0;
  const intersection = [...a].filter(value => b.has(value)).length;
  return intersection / Math.sqrt(a.size * b.size);
}
export function linkPredictionMarkets(markets = [], assets = []) {
  const links = [];
  for (const market of markets) {
    const probability = Number(market.probability);
    if (!Number.isFinite(probability)) continue;
    for (const asset of assets) {
      const assetText = [asset.id, asset.symbol, asset.name, ...(asset.tags || [])].join(' ');
      const semantic = similarity(market.question, assetText);
      const categoryMatch = (asset.tags || []).some(tag => String(market.category || '').toLowerCase().includes(String(tag).toLowerCase()));
      const relevance = clamp(semantic * 75 + (categoryMatch ? 20 : 0) + Math.min(10, Math.log10(Math.max(1, market.volume || 0))), 0, 100);
      if (relevance < 18) continue;
      links.push(Object.freeze({
        marketId: market.id, assetId: asset.id || asset.symbol, symbol: asset.symbol || asset.id,
        probability: round(probability * 100, 2), relevance: round(relevance, 2),
        liquidityScore: round(clamp(Math.log10(Math.max(1, market.liquidity || market.volume || 0)) / 6 * 100, 0, 100), 2),
        direction: probability >= 0.6 ? 'BULLISH' : probability <= 0.4 ? 'BEARISH' : 'VOLATILE',
        explanation: `Prediction probability ${round(probability * 100, 1)}%; semantic relevance ${round(relevance, 1)}/100.`
      }));
    }
  }
  return Object.freeze(links.sort((a, b) => b.relevance - a.relevance));
}
