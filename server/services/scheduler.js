const { fetchMarkets, fetchCharts } = require('./marketService');
const { fetchPolymarket } = require('./polymarketService');
const { fetchEvents } = require('./eventService');
const { buildRapid } = require('../engines/rapidEngine');
const { buildSignals } = require('../engines/signalEngine');
const { setState, state, pushEvent } = require('./state');
let running = false;
let knownEvents = new Set();
async function refreshNow(){
  if(running) return { ok:false, reason:'already running' };
  running = true;
  try{
    const [markets, klines, polymarket, eventBundle] = await Promise.all([fetchMarkets(), fetchCharts(), fetchPolymarket(), fetchEvents()]);
    const events = Array.isArray(eventBundle) ? eventBundle : (eventBundle.events || []);
    const xfeed = Array.isArray(eventBundle) ? [] : (eventBundle.xfeed || []);
    const xStatus = Array.isArray(eventBundle) ? {connected:false, reason:'legacy bundle'} : (eventBundle.xStatus || {connected:false, reason:'not configured'});
    const conflictFeedStatus = Array.isArray(eventBundle) ? 'legacy bundle' : (eventBundle.conflictFeedStatus || 'open conflict feeds not checked');
    const newOnes = events.filter(e => !knownEvents.has(e.id));
    for(const e of events) knownEvents.add(e.id);
    const rapid = buildRapid(markets, klines, polymarket, events);
    const signals = buildSignals(events, markets, polymarket);
    setState({ markets, klines, polymarket, events, xfeed, xStatus, conflictFeedStatus, rapid, signals });
    if(state.refreshCount > 1){ for(const e of newOnes.slice(0,3)) pushEvent(e); }
    return { ok:true, markets:markets.length, events:events.length, rapid:rapid.length, signals:signals.length };
  } finally { running = false; }
}
function startScheduler(){ setInterval(() => refreshNow().catch(e => console.error('[refresh]', e.message)), 45_000); }
module.exports = { refreshNow, startScheduler };
