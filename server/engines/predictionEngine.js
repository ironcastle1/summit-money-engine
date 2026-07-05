function hasNum(n){ return Number.isFinite(Number(n)); }
function clamp(n,a=0,b=100){ return Math.max(a, Math.min(b, n)); }
function pct(a,b){ return b ? ((a-b)/b)*100 : null; }
function cleanSeries(series){ return (series || []).filter(x => hasNum(x.v)).map(x => ({ t:x.t, v:Number(x.v) })); }
function seriesStats(series){
  const pts = cleanSeries(series);
  if(pts.length < 8) return null;
  const last = pts[pts.length-1].v;
  const first = pts[0].v;
  const shortBase = pts[Math.max(0, pts.length-5)].v;
  const midBase = pts[Math.max(0, pts.length-13)].v;
  const shortMove = pct(last, shortBase);
  const midMove = pct(last, midBase);
  const fullMove = pct(last, first);
  const recent = pts.slice(-18);
  const high = Math.max(...recent.map(p => p.v));
  const low = Math.min(...recent.map(p => p.v));
  const volatility = Math.abs(pct(high, low) || 0);
  let upCandles = 0;
  let downCandles = 0;
  for(let i=1;i<recent.length;i++){
    if(recent[i].v > recent[i-1].v) upCandles++;
    if(recent[i].v < recent[i-1].v) downCandles++;
  }
  return {
    last,
    shortMove: Number((shortMove || 0).toFixed(2)),
    midMove: Number((midMove || 0).toFixed(2)),
    fullMove: Number((fullMove || 0).toFixed(2)),
    volatility: Number(volatility.toFixed(2)),
    upRatio: recent.length > 1 ? upCandles / (recent.length - 1) : 0,
    downRatio: recent.length > 1 ? downCandles / (recent.length - 1) : 0
  };
}
function eventMatches(asset, events){
  const terms = [asset.id, asset.symbol, asset.label, asset.name].filter(Boolean).map(x => String(x).toLowerCase());
  return (events || []).filter(e => {
    const hay = `${e.title || ''} ${e.summary || ''} ${(e.watch || []).join(' ')}`.toLowerCase();
    return terms.some(t => t && hay.includes(t.toLowerCase()));
  });
}
function marketMatches(asset, polymarket){
  const terms = [asset.id, asset.label, asset.name].filter(Boolean).map(x => String(x).toLowerCase());
  return (polymarket || []).filter(p => {
    const q = String(p.question || '').toLowerCase();
    return terms.some(t => t && q.includes(t));
  });
}
function ratingFor(asset, stats, events, pm){
  if(!stats && !hasNum(asset.changePct)) return null;
  const move24 = hasNum(asset.changePct) ? Number(asset.changePct) : stats.fullMove;
  const momentum = clamp((move24 + 4) * 7, 0, 38);
  const short = stats ? clamp((stats.shortMove + 2) * 7, 0, 22) : 0;
  const trend = stats ? clamp(stats.upRatio * 20, 0, 20) : 0;
  const eventBoost = clamp(events.length * 4, 0, 10);
  const marketBoost = clamp(pm.length * 5, 0, 10);
  const volatilityPenalty = stats ? clamp(Math.max(0, stats.volatility - 8) * 1.4, 0, 18) : 0;
  const rating = Math.round(clamp(momentum + short + trend + eventBoost + marketBoost - volatilityPenalty, 0, 100));
  const direction = rating >= 65 && move24 >= 0 ? 'upside watch' : rating >= 50 ? 'watch' : 'avoid';
  return { rating, direction };
}
function buildPredictions(markets, klines, events, polymarket){
  const rows = [];
  for(const asset of markets || []){
    const stats = seriesStats(klines?.[asset.symbol]);
    const ev = eventMatches(asset, events);
    const pm = marketMatches(asset, polymarket);
    const scored = ratingFor(asset, stats, ev, pm);
    if(!scored) continue;
    rows.push({
      id: `pred-${asset.id}`,
      asset: asset.id,
      label: asset.label || asset.name,
      group: asset.group || asset.type,
      symbol: asset.symbol,
      price: hasNum(asset.price) ? Number(asset.price) : null,
      changePct: hasNum(asset.changePct) ? Number(asset.changePct) : null,
      rating: scored.rating,
      direction: scored.direction,
      source: asset.source,
      status: asset.status,
      stats: stats || null,
      eventMatches: ev.length,
      marketMatches: pm.length,
      reasons: [
        hasNum(asset.changePct) ? `24h move ${Number(asset.changePct).toFixed(2)}%` : '24h move N/A',
        stats ? `short move ${stats.shortMove}%` : 'short move N/A',
        stats ? `trend up candles ${Math.round(stats.upRatio * 100)}%` : 'trend N/A',
        `${ev.length} source-linked event matches`,
        `${pm.length} prediction-market matches`
      ],
      caution: 'Measured rating from live/recent data. Not a guarantee and not financial advice.'
    });
  }
  return rows.sort((a,b) => b.rating - a.rating).slice(0, 30);
}

module.exports = { buildPredictions };
