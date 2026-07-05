window.APP_STATE=null;
async function getJson(url, opts){ const r=await fetch(url, opts); if(!r.ok) throw new Error(url); return r.json(); }
function applyState(state){
  window.APP_STATE=state;
  document.getElementById('status').textContent = state.lastRefresh ? `LIVE ${new Date(state.lastRefresh).toLocaleTimeString()}` : 'loading';
  Renderers.renderMarkets(state.markets);
  MoneyMap.renderEvents(state.events||[]);
}
async function boot(){
  Panels.init(); MoneyMap.init();
  const [mapData,state]=await Promise.all([getJson('/api/map'),getJson('/api/snapshot')]);
  MoneyMap.setData(mapData,state); applyState(state);
  document.getElementById('refresh').addEventListener('click', async()=>{ document.getElementById('status').textContent='REFRESHING'; await getJson('/api/refresh',{method:'POST'}); applyState(await getJson('/api/snapshot')); });
  document.getElementById('placeSearch')?.addEventListener('submit', async e => {
    e.preventDefault();
    const q = document.getElementById('placeQuery')?.value || '';
    Renderers.renderSearch(await getJson(`/api/search-place?q=${encodeURIComponent(q)}&limit=8`));
  });
  const stream=new EventSource('/api/stream');
  stream.onmessage=e=>{ const msg=JSON.parse(e.data); if(msg.state) applyState(msg.state); if(msg.type==='new_event'&&msg.event) MoneyMap.newEvent(msg.event); };
  setInterval(async()=>{ try{ applyState(await getJson('/api/snapshot')); }catch(e){} },45000);
}
boot().catch(e=>{ console.error(e); document.body.insertAdjacentHTML('beforeend',`<pre style="position:fixed;inset:20px;background:#111;color:#f55;z-index:9999;padding:20px">${e.stack}</pre>`); });
