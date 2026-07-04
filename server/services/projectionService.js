function buildProjection(asset){
  const change = Number(asset.changePct || 0);
  const abs = Math.abs(change);
  const momentum = Math.max(-1, Math.min(1, change / 7));
  const hasLive = /live|binance|yahoo/i.test(`${asset.source || ''} ${asset.status || ''}`);
  const trendScore = Math.round(Math.max(5, Math.min(95, 50 + momentum * 28 + (hasLive ? 7 : -8) + Math.min(10, abs))));
  const reversalScore = 100 - trendScore;
  const now = Number(asset.price || 0);
  const pts = [];
  const upper = [];
  const lower = [];
  for (let i=0;i<16;i++){
    const drift = (momentum * i * 0.0038) + (Math.sin(i/2.5) * 0.0011);
    const uncertainty = (0.0025 + i*0.0009) * now;
    const mid = +(now * (1 + drift)).toFixed(4);
    pts.push({ t:i, price: mid });
    upper.push({ t:i, price:+(mid + uncertainty).toFixed(4) });
    lower.push({ t:i, price:+(mid - uncertainty).toFixed(4) });
  }
  const reason = [];
  if (change > 0) reason.push(`${asset.symbol} is up ${change.toFixed(2)}% on the latest refresh.`);
  if (change < 0) reason.push(`${asset.symbol} is down ${Math.abs(change).toFixed(2)}% on the latest refresh.`);
  reason.push(hasLive ? 'Feed marked live or delayed-live.' : 'Feed is fallback/delayed; require stronger confirmation.');
  if (abs > 2) reason.push('Move is large enough to require confirmation before chasing.');
  const verify = [
    `${asset.symbol} remains in the same direction on the next refresh`,
    'related assets confirm instead of diverging',
    'fresh news/event dots support the move, not old headlines'
  ];
  return {
    symbol: asset.symbol,
    name: asset.name,
    price: asset.price,
    changePct: asset.changePct,
    probability: { keepRising: trendScore, drop: reversalScore },
    verdict: trendScore >= 63 ? 'continuation favoured if confirmation holds' : trendScore <= 42 ? 'reversal/fade risk is higher' : 'unclear; wait for confirmation',
    reasons: reason,
    verify,
    sources: [asset.source || 'market feed', asset.status || 'status unknown'],
    series: pts,
    upper,
    lower
  };
}
function buildRapidMoves(prices=[]){
  return prices
    .filter(p => Math.abs(Number(p.changePct||0)) >= 0.45)
    .sort((a,b)=>Math.abs(b.changePct)-Math.abs(a.changePct))
    .slice(0,12)
    .map(buildProjection);
}
module.exports = { buildRapidMoves };
