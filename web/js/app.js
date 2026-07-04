window.APP_STATE=null;
async function getJson(url, opts){ const r=await fetch(url, opts); if(!r.ok) throw new Error(url); return r.json(); }
function applyState(state){
  window.APP_STATE=state;
  document.getElementById('status').textContent = state.lastRefresh ? `LIVE ${new Date(state.lastRefresh).toLocaleTimeString()}` : 'loading';
  Renderers.renderTicker(state.markets); Renderers.renderMarkets(state.markets); Renderers.renderPolymarket(state.polymarket); Renderers.renderSignals(state.signals); Renderers.renderRapid(state.rapid); Charts.renderCharts(state.klines||{}); MoneyMap.renderEvents(state.events||[]);
}
async function boot(){
  Panels.init(); MoneyMap.init();
  const [mapData,state]=await Promise.all([getJson('/api/map'),getJson('/api/snapshot')]);
  MoneyMap.setData(mapData,state); applyState(state);
  document.getElementById('refresh').addEventListener('click', async()=>{ document.getElementById('status').textContent='REFRESHING'; await getJson('/api/refresh',{method:'POST'}); const s=await getJson('/api/snapshot'); applyState(s); });
  const stream=new EventSource('/api/stream');
  stream.onmessage=e=>{ const msg=JSON.parse(e.data); if(msg.state) applyState(msg.state); if(msg.type==='new_event'&&msg.event) MoneyMap.newEvent(msg.event); };
  setInterval(async()=>{ try{ applyState(await getJson('/api/snapshot')); }catch(e){} },60000);
}
boot().catch(e=>{ console.error(e); document.body.insertAdjacentHTML('beforeend',`<pre style="position:fixed;inset:20px;background:#111;color:#f55;z-index:9999;padding:20px">${e.stack}</pre>`); });
