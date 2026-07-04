window.MoneyMap = (() => {
  let map, nodesLayer, cityLayer, eventsLayer, seaLayer, landLayer, riskLayer;
  let currentFilter = 'all';
  window.SHOW_SEA = false;
  window.SHOW_LAND = false;
  let lastEventIds = new Set();
  const colors = {war:'#c4002f',terror:'#ff004f',disaster:'#ff7b22',election:'#a871ff',shipping:'#00d8ff',port:'#00d8ff',ai:'#a871ff',tech:'#a871ff',energy:'#00ff87',commodity:'#ffd94a',finance:'#3ea0ff',city:'#7aa7ff',risk:'#ff326a'};
  const riskFill = { darkred:'#b0002f', red:'#e0184f', yellow:'#ffb000', green:'#00a66a' };
  function sound(){ try{ const A=window.AudioContext||window.webkitAudioContext; const ctx=new A(); const o=ctx.createOscillator(); const g=ctx.createGain(); o.type='sine'; o.frequency.value=880; g.gain.value=.035; o.connect(g); g.connect(ctx.destination); o.start(); setTimeout(()=>o.frequency.value=1180,90); setTimeout(()=>{o.stop();ctx.close();},260); }catch(e){} }
  function icon(kind, flash=false){ return L.divIcon({ className:'', html:`<div class="node-dot ${kind} ${flash?'flash':''}"></div>`, iconSize:[18,18], iconAnchor:[9,9] }); }
  function init(){
    map=L.map('map',{worldCopyJump:false,zoomSnap:.25,zoomDelta:.5,minZoom:2.62,maxZoom:16,zoomControl:true,attributionControl:true,maxBounds:[[-82,-179.95],[82,179.95]],maxBoundsViscosity:1}).setView([20,12],2.75);
    // CARTO dark layer gives a real HD map with labels; CSS makes it blue/navy rather than black/grey.
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',{subdomains:'abcd',noWrap:true,bounds:[[-85,-180],[85,180]],attribution:'&copy; OpenStreetMap &copy; CARTO', updateWhenIdle:false, updateWhenZooming:false, keepBuffer:4}).addTo(map);
    riskLayer=L.layerGroup().addTo(map); seaLayer=L.layerGroup(); landLayer=L.layerGroup(); nodesLayer=L.layerGroup().addTo(map); cityLayer=L.layerGroup().addTo(map); eventsLayer=L.layerGroup().addTo(map);
    map.on('zoomend moveend',()=>{ renderEvents(window.APP_STATE?.events||[]); renderCities(window.MAP_DATA?.cityNodes||[]); resize(); });
    map.on('click', async e => { const d=await fetch(`/api/context?lat=${e.latlng.lat}&lng=${e.latlng.lng}`).then(r=>r.json()); try{ const rev=await fetch(`/api/reverse?lat=${e.latlng.lat}&lng=${e.latlng.lng}`).then(r=>r.json()); d.reverse=rev; }catch(_){} Renderers.renderContext(d); });
    document.addEventListener('change', e=>{ if(e.target?.id==='seaToggle'){ window.SHOW_SEA=!!e.target.checked; renderRoutes(window.ROUTES||[]); } if(e.target?.id==='landToggle'){ window.SHOW_LAND=!!e.target.checked; renderRoutes(window.ROUTES||[]); } if(e.target?.dataset?.layer){ document.body.classList.toggle('hide-'+e.target.dataset.layer, !e.target.checked); }});
    setTimeout(resize,250);
  }
  function renderLegend(){ const el=document.getElementById('legend'); const keys={war:'war',terror:'terror',disaster:'disaster',election:'election',shipping:'shipping',ai:'AI',commodity:'commodity',energy:'energy',finance:'finance',city:'city'}; el.innerHTML=Object.entries(keys).map(([k,v])=>`<span><i style="background:${colors[k]}"></i>${v}</span>`).join(''); }
  function renderRiskRegions(regions){
    riskLayer.clearLayers();
    for(const r of regions||[]){
      const fill = riskFill[r.level] || '#e0184f';
      const opts={pane:'overlayPane',color:fill,weight:2,opacity:.95,fillColor:fill,fillOpacity:r.level==='darkred'?.28:r.level==='red'?.22:.16,className:`risk-poly risk-${r.level||'red'}`};
      const layer = Array.isArray(r.poly) && r.poly.length ? L.polygon(r.poly, opts) : L.rectangle(r.bounds, opts);
      layer.on('click',()=>Renderers.renderRiskRegion(r)).addTo(riskLayer);
    }
  }
  function renderBase(nodes){ nodesLayer.clearLayers(); for(const n of nodes||[]){ const kind=n.kind==='tech'?'ai':n.kind; L.marker([n.lat,n.lng],{icon:icon(kind)}).on('click',()=>Renderers.renderNode(n)).addTo(nodesLayer); } renderLegend(); }
  function renderCities(cities){ cityLayer.clearLayers(); const z=map.getZoom(); if(z<4.0) return; const bounds=map.getBounds(); const limit=z>=11?1400:z>=9?950:z>=7?620:z>=5?300:160; for(const c of (cities||[]).filter(x=>bounds.pad(.55).contains([x.lat,x.lng])).slice(0,limit)){ L.marker([c.lat,c.lng],{icon:icon(c.kind||'city')}).on('click',()=>Renderers.renderNode(c)).addTo(cityLayer); } }
  function renderEvents(events, flashIds=new Set()){ eventsLayer.clearLayers(); const z=map.getZoom(); const bounds=map.getBounds(); const filtered=(events||[]).filter(e=> currentFilter==='all' || e.kind===currentFilter || (currentFilter==='ai' && e.kind==='tech')); const visible=filtered.filter(e=>z<4.5 || bounds.pad(.55).contains([e.lat,e.lng])).slice(0,z>=10?1600:z>=8?1100:z>=6?760:520); for(const e of visible){ const kind=e.kind==='tech'?'ai':e.kind; L.marker([e.lat,e.lng],{icon:icon(kind, flashIds.has(e.id))}).on('click',()=>Renderers.renderEvent(e)).addTo(eventsLayer); } }
  function renderRoutes(routes){
    if(map.hasLayer(seaLayer)) map.removeLayer(seaLayer);
    if(map.hasLayer(landLayer)) map.removeLayer(landLayer);
    seaLayer.clearLayers(); landLayer.clearLayers();
    if(window.SHOW_SEA) seaLayer.addTo(map);
    if(window.SHOW_LAND) landLayer.addTo(map);
    if(!window.SHOW_SEA && !window.SHOW_LAND) return;
    const add = r => { const layer=r.type==='sea'?seaLayer:landLayer; const pts=r.points.map(p=>[p[0],p[1]]); const cls=r.type==='sea'?'moving-route sea-route':'moving-route land-route'; L.polyline(pts,{color:r.color,weight:r.type==='sea'?8:7,opacity:.18,className:'route-shadow'}).on('click',()=>Renderers.renderRoute(r)).addTo(layer); L.polyline(pts,{color:r.color,weight:r.type==='sea'?3:3,opacity:.92,className:cls}).on('click',()=>Renderers.renderRoute(r)).addTo(layer); if(map.getZoom()>=4.2){ const mid=pts[Math.floor(pts.length/2)]; L.marker(mid,{icon:L.divIcon({className:'route-label',html:`${r.name}<br><span>${r.goods}</span>`,iconSize:null})}).on('click',()=>Renderers.renderRoute(r)).addTo(layer); } };
    for(const r of routes||[]){ if(r.type==='sea' && window.SHOW_SEA) add(r); if(r.type==='land' && window.SHOW_LAND) add(r); }
  }
  function setData(mapData,state){ window.MAP_DATA=mapData; window.ROUTES=mapData.routes||[]; window.SHOW_SEA=false; window.SHOW_LAND=false; if(map.hasLayer(seaLayer)) map.removeLayer(seaLayer); if(map.hasLayer(landLayer)) map.removeLayer(landLayer); renderRiskRegions(mapData.riskRegions||[]); renderBase(mapData.nodes); renderCities(mapData.cityNodes); renderRoutes(mapData.routes); renderEvents(state?.events||[]); setTimeout(resize,250); }
  function newEvent(e){ if(!e || lastEventIds.has(e.id)) return; lastEventIds.add(e.id); showToast(e.title); sound(); renderEvents(window.APP_STATE?.events||[], new Set([e.id])); }
  function showToast(text){ const t=document.getElementById('toast'); t.textContent='NEW MAP EVENT: '+String(text||'').slice(0,155); t.classList.remove('show'); void t.offsetWidth; t.classList.add('show'); setTimeout(()=>t.classList.remove('show'),6500); }
  function resize(){ if(!map) return; const w=document.getElementById('map')?.clientWidth||1200; const min=Math.max(2.62, Math.log2((w+260)/256)); map.setMinZoom(Math.min(3.05,min)); map.invalidateSize(); if(map.getZoom()<map.getMinZoom()) map.setZoom(map.getMinZoom()); setTimeout(()=>map.invalidateSize(),220); }
  return { init,setData,newEvent,resize,renderEvents,renderCities,renderRoutes,renderRiskRegions };
})();
