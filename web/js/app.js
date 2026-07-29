(async function(){
  const $=id=>document.getElementById(id);
  const TEXT={en:{searchPlaceholder:'Search street, area, town or city',radius:'Radius',scan:'SCAN',loading:'Loading',areaScan:'Area Scan',dotsOn:'DOTS ON',dotsOff:'DOTS OFF'}};
  let audioReady=false, lastEventIds=new Set();
  window.addEventListener('click',()=>audioReady=true,{once:true}); window.addEventListener('keydown',()=>audioReady=true,{once:true});
  function beep(){ if(!audioReady) return; try{ const ctx=new (window.AudioContext||window.webkitAudioContext)(); const o=ctx.createOscillator(), g=ctx.createGain(); o.frequency.value=880; g.gain.value=.07; o.connect(g); g.connect(ctx.destination); o.start(); setTimeout(()=>{o.stop();ctx.close();},150); }catch{} }
  function applyLang(){ const t=TEXT.en; document.querySelectorAll('[data-i18n-placeholder]').forEach(el=>{el.placeholder=t[el.dataset.i18nPlaceholder]||el.placeholder}); MoneyMap.setLanguage(t); Renderers.setLanguage(t); }
  $('panelClose').onclick=()=>$('panel').classList.remove('open'); $('languageSelect').onchange=applyLang; applyLang();
  MoneyMap.init();
  async function load(){ const [s,m]=await Promise.all([API.state(),API.mapData()]); window.APP_STATE=s; window.MAP_DATA=m; MoneyMap.setData(m,s); lastEventIds=new Set((s.events||[]).map(e=>e.id)); }
  try{ await load(); }catch(e){ Renderers.panel('Load failed',`<div class="card"><h3>Backend failed</h3><p>${e.message}</p></div>`); }
  function scanInput(){ return {query:String($('searchBox').value||'').trim(),radiusMiles:Number($('radiusMiles').value||5),filter:String($('scanFilter').value||'all')}; }
  async function runScan(){ const input=scanInput(); if(!input.query) return; Renderers.miniLoading('Area Scan'); const res=await API.areaScan(input); MoneyMap.drawAreaScan(res); Renderers.areaScanResult(res); }
  $('searchBtn').onclick=runScan;
  ['searchBox','radiusMiles','scanFilter'].forEach(id=>$(id).addEventListener('keydown',e=>{ if(e.key==='Enter'){ e.preventDefault(); runScan(); }}));
  document.querySelectorAll('#tabs button[data-tab]').forEach(btn=>btn.onclick=async()=>{ const tab=btn.dataset.tab; if(tab==='live'){ const s=window.APP_STATE||await API.state(); Renderers.liveBrief(s.liveBrief); } if(tab==='crisis'){ const s=window.APP_STATE||await API.state(); Renderers.crisis(s); } if(tab==='sources') Renderers.sources(await API.sources()); if(tab==='ops') V7UI.ops(await API.v7Console()); if(tab==='route') V7UI.routeForm(); if(tab==='watch') V7UI.watchPanel(); if(tab==='offline') V7UI.offlineForm(); if(tab==='threats') V7UI.threatForm(); });
  const ev=new EventSource('/api/stream'); ev.onmessage=msg=>{ try{ const p=JSON.parse(msg.data); if(!p.state)return; const incoming=p.state.events||[]; const fresh=incoming.filter(e=>e.id&&!lastEventIds.has(e.id)).filter(e=>['war','terror','movement','crisis','politics','crime'].includes(e.kind)).slice(0,1); window.APP_STATE=p.state; incoming.forEach(e=>{if(e.id)lastEventIds.add(e.id)}); API.mapData().then(m=>{window.MAP_DATA=m; MoneyMap.setData(m,p.state);}); if(fresh.length){ MoneyMap.liveAlert(fresh[0]); beep(); } }catch{} };
})();
