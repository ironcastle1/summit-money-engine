const VERSION = 'SUMMIT-MONEY-ENGINE-PART16-CLEAR-CARDS-INDEXES-ALERTS';

const state = {
  markets: [],
  klines: {},
  polymarket: [],
  events: [],
  signals: [],
  rapid: [],
  mapData: null,
  xfeed: [],
  xStatus: { connected:false, reason:'not checked' },
  conflictFeedStatus: 'not checked',
  updatedAt: null,
  lastRefresh: null,
  updateCount: 0,
  refreshCount: 0,
  newEvents: []
};

const clients = new Set();

function snapshot(){
  return {
    version: VERSION,
    markets: state.markets,
    klines: state.klines,
    polymarket: state.polymarket,
    events: state.events,
    signals: state.signals,
    rapid: state.rapid,
    xfeed: state.xfeed,
    xStatus: state.xStatus,
    conflictFeedStatus: state.conflictFeedStatus,
    updatedAt: state.updatedAt,
    lastRefresh: state.lastRefresh,
    updateCount: state.updateCount,
    refreshCount: state.refreshCount,
    newEvents: state.newEvents
  };
}

function send(client, payload){
  try { client.write(`data: ${JSON.stringify(payload)}\n\n`); }
  catch (_) { clients.delete(client); }
}

function broadcast(payload){
  for (const client of clients) send(client, payload);
}

function setState(partial){
  Object.assign(state, partial);
  state.updatedAt = new Date().toISOString();
  state.lastRefresh = state.updatedAt;
  state.updateCount += 1;
  state.refreshCount += 1;
  broadcast({ type: 'state', state: snapshot() });
  return snapshot();
}

function pushEvent(event){
  if(!event) return;
  state.newEvents = [event, ...state.newEvents].slice(0, 30);
  broadcast({ type: 'new_event', event });
}

function subscribe(req, res){
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no'
  });
  res.write(': connected\n\n');
  clients.add(res);
  send(res, { type: 'state', state: snapshot() });
  const keepAlive = setInterval(() => {
    try { res.write(': keepalive\n\n'); }
    catch (_) { clearInterval(keepAlive); clients.delete(res); }
  }, 25000);
  req.on('close', () => { clearInterval(keepAlive); clients.delete(res); });
}

module.exports = { VERSION, state, snapshot, setState, subscribe, pushEvent };
