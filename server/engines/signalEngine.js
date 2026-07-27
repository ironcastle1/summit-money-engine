function signalFromEvent(e, markets){
  const watch = e.watch || [];
  const related = markets.filter(m => watch.includes(m.id) || watch.includes(m.symbol) || watch.includes(m.label));
  const moving = related.filter(m => Math.abs(m.changePct||0) > 0.7);
  const score = Math.min(96, 40 + moving.length*14 + (e.kind==='war'||e.kind==='disaster'?10:0) + (e.source==='X API'?8:0));
  return {
    id:`sig-${e.id}`, kind:e.kind, title:e.title, place:e.place, source:e.source, url:e.url, score,
    watch: watch.join(', '),
    why: e.summary,
    checks: [
      moving.length ? `Market confirmation: ${moving.map(m=>`${m.id} ${m.changePct}%`).join(', ')}` : 'No market confirmation yet',
      'Open source and confirm it is not duplicate/noise',
      'Check related asset chart before risking money'
    ],
    status: moving.length ? 'market moving' : 'watch only'
  };
}
function buildSignals(events, markets, polymarket){
  const fromEvents = events.map(e => signalFromEvent(e, markets));
  const fromPm = polymarket.slice(0,12).map(p => ({
    id:`sig-pm-${p.id}`, kind:'prediction', title:p.question, place:'Prediction market', source:'Polymarket', url:p.url,
    score: Math.min(95, 45 + Math.log10((p.volume||1))*10 + Math.log10((p.liquidity||1))*6), watch:'event odds, related assets',
    why:`High-volume event market. Volume ${Math.round(p.volume||0)}, liquidity ${Math.round(p.liquidity||0)}.`,
    checks:['Compare odds movement with live market price movement','Avoid illiquid markets','Use as signal, not as proof'], status:'watch odds'
  }));
  return [...fromEvents, ...fromPm].sort((a,b)=>b.score-a.score).slice(0,40);
}
module.exports = { buildSignals };
