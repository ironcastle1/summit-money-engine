function pct(a,b){ return b ? ((a-b)/b)*100 : null; }
function cleanSeries(series){ return (series||[]).filter(x=>Number.isFinite(Number(x.v))).map(x=>({t:x.t,v:Number(x.v)})); }
function actualStats(series){
  const pts = cleanSeries(series);
  if(pts.length < 12) return null;
  const last = pts[pts.length-1].v;
  const p4 = pts[Math.max(0, pts.length-5)].v;
  const p12 = pts[Math.max(0, pts.length-13)].v;
  const first = pts[0].v;
  const moveShort = pct(last,p4);
  const moveWindow = pct(last,p12);
  const moveFull = pct(last,first);
  const diffs=[];
  for(let i=Math.max(1,pts.length-18); i<pts.length; i++) diffs.push(pts[i].v-pts[i-1].v);
  const direction = (moveShort||0) >= 0 ? 'up' : 'down';
  const sameDirection = diffs.filter(d => direction==='up' ? d>0 : d<0).length;
  const trendHeldPct = diffs.length ? Math.round((sameDirection/diffs.length)*100) : null;
  const volatilityPct = Math.abs(pct(Math.max(...pts.slice(-18).map(p=>p.v)), Math.min(...pts.slice(-18).map(p=>p.v)))||0);
  return {
    last,
    moveShort:Number((moveShort||0).toFixed(2)),
    moveWindow:Number((moveWindow||0).toFixed(2)),
    moveFull:Number((moveFull||0).toFixed(2)),
    trendHeldPct,
    volatilityPct:Number(volatilityPct.toFixed(2)),
    points: pts.slice(-80),
    direction
  };
}
function buildRapid(markets, klines, polymarket, events){
  const rows = [];
  for(const m of markets||[]){
    const s = actualStats(klines?.[m.symbol]);
    if(!s) continue;
    const headlineHits = (events||[]).filter(e => (e.watch||[]).includes(m.id) || (e.watch||[]).includes(m.symbol) || new RegExp(`\\b${m.id}\\b|${m.name||m.label||''}`,'i').test(`${e.title||''} ${e.summary||''}`)).length;
    const marketHits = (polymarket||[]).filter(p => new RegExp(`${m.id}|${m.name||m.label||''}`,'i').test(p.question||'')).length;
    const absMove = Math.max(Math.abs(s.moveShort), Math.abs(s.moveWindow));
    if(absMove < 0.3 && headlineHits === 0 && marketHits === 0) continue;
    rows.push({
      id:`rapid-${m.id}`,
      asset:m.id,
      label:m.label || m.name,
      symbol:m.symbol,
      price:m.price,
      moveShort:s.moveShort,
      moveWindow:s.moveWindow,
      moveFull:s.moveFull,
      trendHeldPct:s.trendHeldPct,
      volatilityPct:s.volatilityPct,
      direction:s.direction,
      rank:Math.round(absMove*12 + headlineHits*6 + marketHits*8 + (s.trendHeldPct||0)/6),
      priceSeries:s.points,
      reasons:[
        `${m.id} moved ${s.moveShort}% over the last short window`,
        `${s.trendHeldPct}% of recent candles moved ${s.direction}`,
        `${headlineHits} current event/news matches`,
        `${marketHits} prediction-market matches`
      ],
      checks:[
        `Confirm ${m.id} still trades in the same direction on the live chart`,
        'Open the linked event/source before taking risk',
        'Avoid if liquidity is thin, spread is wide, or the move has already reversed'
      ],
      warning:'Percentages here are measured from live/recent candles. They are not AI profit predictions.'
    });
  }
  return rows.sort((a,b)=>b.rank-a.rank).slice(0,14);
}
module.exports = { buildRapid };
