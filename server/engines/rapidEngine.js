function pct(a,b){ return b ? ((a-b)/b)*100 : 0; }
function scoreSeries(series){
  if(!series || series.length < 10) return null;
  const vals = series.map(x=>x.v).filter(Number.isFinite);
  if(vals.length < 10) return null;
  const last = vals[vals.length-1], prev = vals[Math.max(0, vals.length-8)], base = vals[0];
  const fast = pct(last, prev); const day = pct(last, base);
  const upCount = vals.slice(-8).filter((v,i,a)=> i && v>a[i-1]).length;
  const continuation = Math.max(8, Math.min(82, 50 + fast*7 + upCount*3));
  const drop = Math.max(6, Math.min(84, 100 - continuation));
  const projection = [];
  for(let i=0;i<12;i++){
    const drift = (fast/100) * last * (i/12);
    const fade = -Math.abs(fast) * last * 0.0009 * i;
    projection.push({ t: Date.now()+i*900000, v: Number((last + drift + fade).toFixed(3)) });
  }
  return { fast:Number(fast.toFixed(2)), day:Number(day.toFixed(2)), continuation:Number(continuation.toFixed(0)), drop:Number(drop.toFixed(0)), projection };
}
function buildRapid(markets, klines, polymarket, events){
  const rows = [];
  for(const m of markets){
    const key = m.symbol;
    const s = scoreSeries(klines[key]);
    if(!s) continue;
    const headlineBoost = events.filter(e => (e.watch||[]).includes(m.id) || (e.watch||[]).includes(m.symbol)).length;
    const eventBoost = polymarket.filter(p => new RegExp(m.id + '|' + m.label, 'i').test(p.question)).length;
    const rank = Math.round(Math.abs(s.fast)*12 + Math.abs(s.day)*4 + headlineBoost*8 + eventBoost*10);
    if(rank < 8) continue;
    rows.push({
      id:`rapid-${m.id}`, asset:m.id, label:m.label, symbol:m.symbol, price:m.price, move15:s.fast, moveDay:s.day,
      continuation:s.continuation, drop:s.drop, rank, projection:s.projection,
      reasons:[
        `${m.id} short-window move ${s.fast}%`,
        `${headlineBoost} current map events mention related assets/themes`,
        eventBoost ? `${eventBoost} prediction-market match` : 'No direct prediction-market match yet'
      ],
      checks:[
        `Confirm ${m.id} remains above last 15m candle open`,
        'Check related event dot source before entry',
        'Avoid if spread/liquidity is poor or the move already reversed'
      ]
    });
  }
  return rows.sort((a,b)=>b.rank-a.rank).slice(0,12);
}
module.exports = { buildRapid };
