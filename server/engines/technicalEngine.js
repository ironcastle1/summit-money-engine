function movingAverage(values, n) {
  if (!values.length) return null;
  const slice = values.slice(-n);
  return slice.reduce((a,b)=>a+b,0) / slice.length;
}

function momentumFromPrice(asset) {
  const pct = Number(asset.changePct || 0);
  if (pct > 3) return 90;
  if (pct > 1.5) return 75;
  if (pct > 0.5) return 62;
  if (pct > 0) return 54;
  if (pct > -0.5) return 46;
  if (pct > -1.5) return 35;
  return 20;
}

function liquidityScore(asset) {
  if (asset.type === 'crypto') return 90;
  if (asset.type === 'etf') return 80;
  if (asset.type === 'stock') return 70;
  if (asset.type === 'commodity') return 65;
  return 40;
}

function marketConfirmation(assets, symbols) {
  const selected = assets.filter(a => symbols.includes(a.symbol));
  if (!selected.length) return { score: 0, confirming: [] };
  const confirming = selected.filter(a => Number(a.changePct) > 0);
  const avg = selected.reduce((s,a)=>s+momentumFromPrice(a),0) / selected.length;
  return { score: Math.round(avg), confirming: confirming.map(a => a.symbol) };
}

module.exports = { movingAverage, momentumFromPrice, liquidityScore, marketConfirmation };
