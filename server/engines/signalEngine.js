const { ruleBook } = require('./signalRules');
const { marketConfirmation } = require('./technicalEngine');

function themeHits(text, themes) {
  const lower = String(text || '').toLowerCase();
  return themes.filter(t => lower.includes(t.toLowerCase()) || lower.includes(t.replace('-', ' '))).length;
}

function collectThemeEvidence({ news, predictionMarkets }, rule) {
  const evidence = [];
  for (const n of news || []) {
    const title = n.title || '';
    const tags = n.themes || [];
    const hit = tags.some(t => rule.themes.includes(t)) || themeHits(title, rule.themes) > 0;
    if (hit) evidence.push({ type: 'news', title, source: n.source, url: n.url });
  }
  for (const m of predictionMarkets || []) {
    const text = m.question || '';
    const hit = themeHits(text, rule.themes) > 0;
    if (hit) evidence.push({ type: 'polymarket', title: text, source: 'Polymarket', url: m.url, volume: m.volume, liquidity: m.liquidity });
  }
  return evidence.slice(0, 5);
}

function capitalBand(rule) {
  if (rule.risk === 'high') return 'small size only; liquid assets; no leverage by default';
  if (rule.risk === 'medium') return 'liquid ETF/equity/crypto watchlist; scale only after confirmation';
  return 'low-risk watchlist; wait for clear trend';
}

function buildSignals({ prices, predictionMarkets, news }) {
  const signals = [];
  for (const rule of ruleBook) {
    const evidence = collectThemeEvidence({ news, predictionMarkets }, rule);
    const confirmation = marketConfirmation(prices, rule.assets);
    const evidenceScore = Math.min(40, evidence.length * 10);
    const score = Math.max(0, Math.min(100, Math.round(confirmation.score * 0.55 + evidenceScore + (rule.risk === 'high' ? 5 : 0))));
    signals.push({
      id: rule.id,
      title: rule.name,
      score,
      risk: rule.risk,
      action: rule.action,
      trigger: rule.trigger,
      capital: capitalBand(rule),
      assets: rule.assets,
      verify: rule.verify,
      evidence,
      confirmingAssets: confirmation.confirming,
      status: score >= 70 ? 'ACTIONABLE WATCH' : score >= 55 ? 'WATCH' : 'WAIT'
    });
  }
  return signals.sort((a,b)=>b.score-a.score);
}

module.exports = { buildSignals };
