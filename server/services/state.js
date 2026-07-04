const VERSION = 'SUMMIT-MONEY-ENGINE-PART6-BLUE-MAP-ROUTES-SIDEINFO';
const state = {
  version: VERSION,
  lastRefresh: null,
  markets: [],
  klines: {},
  events: [],
  polymarket: [],
  rapid: [],
  signals: [],
  history: [],
  refreshCount: 0,
};
const listeners = new Set();
function snapshot(){ return JSON.parse(JSON.stringify(state)); }
function setState(patch){
  Object.assign(state, patch, { lastRefresh: new Date().toISOString(), refreshCount: state.refreshCount + 1 });
  const payload = `data: ${JSON.stringify({ type:'snapshot', state: snapshot() })}\n\n`;
  for(const res of listeners){ try { res.write(payload); } catch (_) {} }
}
function pushEvent(evt){
  state.events.unshift(evt);
  state.events = state.events.slice(0, 250);
  const payload = `data: ${JSON.stringify({ type:'new_event', event: evt, state: snapshot() })}\n\n`;
  for(const res of listeners){ try { res.write(payload); } catch (_) {} }
}
function subscribe(req,res){
  res.writeHead(200, { 'Content-Type':'text/event-stream', 'Cache-Control':'no-cache', Connection:'keep-alive' });
  res.write(`data: ${JSON.stringify({ type:'snapshot', state: snapshot() })}\n\n`);
  listeners.add(res);
  req.on('close', () => listeners.delete(res));
}
module.exports = { VERSION, state, snapshot, setState, pushEvent, subscribe };
