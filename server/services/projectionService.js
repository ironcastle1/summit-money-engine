function buildProjection(asset){
  const change = Number(asset.changePct || 0);
  const momentum = Math.max(-1, Math.min(1, change / 6));
  const keepRising = Math.round(Math.max(12, Math.min(88, 50 + momentum * 28 + (asset.volume ? 6 : 0))));
  const drop = 100 - keepRising;
  const now = Number(asset.price || 0);
  const pts = [];
  for (let i=0;i<12;i++){
    const drift = (momentum * i * 0.0035) + (Math.sin(i/2) * 0.0012);
    pts.push({ t:i, price: +(now * (1 + drift)).toFixed(4) });
  }
  return {
    symbol: asset.symbol,
    name: asset.name,
    price: asset.price,
    changePct: asset.changePct,
    probability: { keepRising, drop },
    verdict: keepRising >= 62 ? 'trend continuation watch' : keepRising <= 40 ? 'fade risk watch' : 'unclear; wait',
    verify: [`${asset.symbol} holds above latest 15m VWAP / moving average`, 'volume remains above recent average', 'related headline/event probability confirms the move'],
    series: pts
  };
}
function buildRapidMoves(prices=[]){
  return prices.filter(p => Math.abs(Number(p.changePct||0)) >= 0.65).sort((a,b)=>Math.abs(b.changePct)-Math.abs(a.changePct)).slice(0,10).map(buildProjection);
}
module.exports = { buildRapidMoves };
