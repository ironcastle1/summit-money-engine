(function () {
  const APP = { state: null, mapData: null, audioReady: false };
  const $ = (s) => document.querySelector(s);
  const esc = (v) => String(v ?? "").replace(/[&<>"']/g, m => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
  const wait = (ms) => new Promise(r => setTimeout(r, ms));
  function setStatus(text){ const el=$("#status"); if(el) el.textContent=text; }
  async function getJson(url){ const r=await fetch(url,{headers:{Accept:"application/json"}}); if(!r.ok) throw new Error(`${url} ${r.status}`); return r.json(); }
  async function postJson(url){ const r=await fetch(url,{method:"POST",headers:{Accept:"application/json"}}); if(!r.ok) throw new Error(`${url} ${r.status}`); return r.json(); }
  async function waitForMoneyMap(){ for(let i=0;i<100;i++){ if(window.MoneyMap&&typeof window.MoneyMap.init==="function") return window.MoneyMap; await wait(60); } throw new Error("MoneyMap did not load. Check web/js/components/map.js"); }
  async function loadState(){ const state=await getJson(`/api/state?t=${Date.now()}`); APP.state=state||{}; window.APP_STATE=APP.state; if(window.Renderers) window.Renderers.renderMarkets(APP.state.markets||[]); return APP.state; }
  async function loadMapData(){ const data=await getJson(`/api/map-data?t=${Date.now()}`); APP.mapData=data||{}; window.MAP_DATA=APP.mapData; return APP.mapData; }
  async function refreshNow(){ setStatus("refreshing"); try{ await postJson("/api/refresh").catch(()=>null); const [state,mapData]=await Promise.all([loadState(),loadMapData()]); if(window.MoneyMap) window.MoneyMap.setData(mapData,state); setStatus(`LIVE ${new Date(state.lastRefresh||Date.now()).toLocaleTimeString()}`); }catch(e){ console.error(e); setStatus("refresh failed"); } }
  function bindUI(){
    document.querySelectorAll("[data-panel]").forEach(btn=>btn.addEventListener("click",()=>window.Renderers&&window.Renderers.openPanel(btn.dataset.panel)));
    const refresh=$("#refresh"); if(refresh) refresh.onclick=refreshNow;
    const home=$("#homeMapButton"); if(home) home.onclick=()=>window.MoneyMap&&window.MoneyMap.goHome();
    const global=$("#globalRiskButton"); if(global) global.onclick=()=>window.MoneyMap&&window.MoneyMap.showGlobalRiskIntro();
    const crisis=$("#weatherTrackerButton"); if(crisis) crisis.onclick=()=>window.MoneyMap&&window.MoneyMap.loadCrisis();
    document.addEventListener("click",()=>{ unlockAudio(); },{once:true});
    document.addEventListener("click",e=>{ const c=e.target.closest("[data-close]"); if(!c) return; const p=c.dataset.close==="drawer"?$("#drawerPanel"):$("#infoPanel"); if(p) p.classList.remove("open","active"); });
    const form=$("#placeSearch"); if(form) form.addEventListener("submit", async e=>{ e.preventDefault(); const q=($("#placeQuery")||{}).value || ""; if(!q.trim()) return; if(window.Panels) window.Panels.setInfo("Search",`<div class="info-card"><h3>Searching</h3><div class="loader-bar"><span></span></div><p>${esc(q)}</p></div>`); try{ const data=await getJson(`/api/search?q=${encodeURIComponent(q.trim())}`); const first=data.places&&data.places[0]; if(first&&window.MoneyMap){ window.MoneyMap.openContext(Number(first.lat),Number(first.lng),9,first.name||q); } else if(window.Panels){ window.Panels.setInfo("Search",`<div class="info-card"><h3>No result</h3><p>No matching place found.</p></div>`); } }catch(err){ if(window.Panels) window.Panels.setInfo("Search failed",`<div class="info-card"><h3>Search failed</h3><p>${esc(err.message)}</p></div>`); } });
  }
  function unlockAudio(){ APP.audioReady=true; }
  function ping(){ if(!APP.audioReady) return; try{ const ctx=new (window.AudioContext||window.webkitAudioContext)(); const o=ctx.createOscillator(); const g=ctx.createGain(); o.connect(g); g.connect(ctx.destination); o.frequency.value=880; g.gain.value=0.04; o.start(); setTimeout(()=>{ o.stop(); ctx.close(); },160); }catch{} }
  function bindSse(){ if(!window.EventSource) return; try{ const source=new EventSource("/api/stream"); source.addEventListener("message", ev=>{ try{ const payload=JSON.parse(ev.data); if(payload.type==="state"&&payload.state){ APP.state=payload.state; window.APP_STATE=APP.state; if(window.Renderers) window.Renderers.renderMarkets(APP.state.markets||[]); if(window.MoneyMap) window.MoneyMap.setData(window.MAP_DATA||{},APP.state); } if(payload.type==="event"&&payload.event){ ping(); if(window.MoneyMap) window.MoneyMap.newEvent(payload.event); } }catch{} }); }catch(e){ console.warn(e); } }
  function installErrorBox(){ window.addEventListener("error",e=>{ const map=$("#map"); if(map) map.innerHTML=`<pre class="boot-error">${esc(e.error&&e.error.stack?e.error.stack:e.message)}</pre>`; }); window.addEventListener("unhandledrejection",e=>{ const map=$("#map"); if(map) map.innerHTML=`<pre class="boot-error">${esc(e.reason&&e.reason.stack?e.reason.stack:e.reason)}</pre>`; }); }
  async function boot(){ installErrorBox(); bindUI(); const MoneyMap=await waitForMoneyMap(); MoneyMap.init(); const [state,mapData]=await Promise.all([loadState(),loadMapData()]); MoneyMap.setData(mapData,state); bindSse(); setStatus(`LIVE ${new Date(state.lastRefresh||Date.now()).toLocaleTimeString()}`); }
  document.addEventListener("DOMContentLoaded",()=>boot().catch(err=>{ console.error(err); setStatus("boot failed"); const map=$("#map"); if(map) map.innerHTML=`<pre class="boot-error">${esc(err.stack||err.message||err)}</pre>`; }));
})();
