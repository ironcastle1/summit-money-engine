function hasNum(n){ return Number.isFinite(Number(n)); }
function pct(n){ return hasNum(n) ? `${Number(n) >= 0 ? '+' : ''}${Number(n).toFixed(2)}%` : 'N/A'; }
function when(t){
  const d = new Date(t);
  return Number.isNaN(d.getTime()) ? 'time N/A' : d.toISOString();
}
function topMarketMoves(markets){
  return (markets || [])
    .filter(m => hasNum(m.changePct))
    .sort((a,b) => Math.abs(Number(b.changePct)) - Math.abs(Number(a.changePct)))
    .slice(0, 10)
    .map(m => ({
      id: m.id,
      label: m.label || m.name,
      move: Number(m.changePct),
      price: hasNum(m.price) ? Number(m.price) : null,
      source: m.source,
      status: m.status
    }));
}
function topEvents(events){
  return (events || [])
    .filter(e => e.url && e.url !== '#')
    .sort((a,b) => new Date(b.time || 0) - new Date(a.time || 0))
    .slice(0, 12)
    .map(e => ({
      title: e.title,
      kind: e.kind,
      place: e.place,
      time: when(e.time),
      source: e.source,
      url: e.url
    }));
}
function feedCounts(state){
  const events = state.events || [];
  const counts = {};
  for(const e of events) counts[e.source || 'unknown'] = (counts[e.source || 'unknown'] || 0) + 1;
  return {
    markets: (state.markets || []).length,
    chartSeries: Object.values(state.klines || {}).filter(rows => Array.isArray(rows) && rows.length).length,
    polymarket: (state.polymarket || []).length,
    events: events.length,
    eventSources: counts,
    rapid: (state.rapid || []).length,
    predictions: (state.predictions || []).length
  };
}
function buildBrief(state){
  const movers = topMarketMoves(state.markets);
  const events = topEvents(state.events);
  const counts = feedCounts(state);
  const rapid = (state.rapid || []).slice(0, 8).map(r => ({
    asset: r.asset,
    label: r.label,
    direction: r.direction,
    shortMove: pct(r.moveShort),
    windowMove: pct(r.moveWindow),
    volatility: pct(r.volatilityPct)
  }));
  return {
    generatedAt: new Date().toISOString(),
    lastRefresh: state.lastRefresh || null,
    counts,
    movers,
    rapid,
    predictions: (state.predictions || []).slice(0, 10),
    events,
    notes: [
      'All prices and candles come from live/delayed market feeds.',
      'No missing market, crime or event value is filled with fake data.',
      'Local crime is official where connected; otherwise use country indicators and N/A.'
    ]
  };
}

module.exports = { buildBrief };
