window.MoneyMap = (() => {
  let map, nodesLayer, cityLayer, localLayer, eventsLayer, seaLayer, landLayer, riskLayer, safetyLayer, conflictCountryLayer, safetyCountryLayer;
  let currentFilter = 'all';
  window.SHOW_SEA = false;
  window.SHOW_LAND = false;
  window.SHOW_SAFETY = true;
  let lastEventIds = new Set();
  const colors = {war:'#ff1f4f',terror:'#ff8c00',disaster:'#ff7b22',election:'#a871ff',shipping:'#00d8ff',port:'#00d8ff',ai:'#a871ff',tech:'#a871ff',energy:'#00ff87',commodity:'#ffd94a',finance:'#3ea0ff',city:'#7aa7ff',risk:'#ff326a'};
  const riskFill = { darkred:'#b0002f', red:'#e0184f', yellow:'#ffb000', green:'#00a66a' };
  function sound(){ try{ const A=window.AudioContext||window.webkitAudioContext; const ctx=new A(); const o=ctx.createOscillator(); const g=ctx.createGain(); o.type='sine'; o.frequency.value=880; g.gain.value=.035; o.connect(g); g.connect(ctx.destination); o.start(); setTimeout(()=>o.frequency.value=1180,90); setTimeout(()=>{o.stop();ctx.close();},260); }catch(e){} }
  function icon(kind, flash=false){ return L.divIcon({ className:'', html:`<div class="node-dot ${kind} ${flash?'flash':''}"></div>`, iconSize:[18,18], iconAnchor:[9,9] }); }
  function init(){
    map=L.map('map',{preferCanvas:true,worldCopyJump:false,zoomSnap:.25,zoomDelta:.5,minZoom:2.62,maxZoom:16,zoomControl:true,attributionControl:true,maxBounds:[[-82,-179.95],[82,179.95]],maxBoundsViscosity:1}).setView([20,12],2.75);
    // CARTO dark layer gives a real HD map with labels; CSS makes it blue/navy rather than black/grey.
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',{subdomains:'abcd',noWrap:true,bounds:[[-85,-180],[85,180]],attribution:'&copy; OpenStreetMap &copy; CARTO', updateWhenIdle:false, updateWhenZooming:false, keepBuffer:4}).addTo(map);
    riskLayer=L.layerGroup(); safetyLayer=L.layerGroup(); conflictCountryLayer=L.layerGroup().addTo(map); safetyCountryLayer=L.layerGroup().addTo(map); seaLayer=L.layerGroup(); landLayer=L.layerGroup(); nodesLayer=L.layerGroup().addTo(map); cityLayer=L.layerGroup().addTo(map); localLayer=L.layerGroup().addTo(map); eventsLayer=L.layerGroup().addTo(map);
    map.on('zoomend moveend',()=>{ renderEvents(window.APP_STATE?.events||[]); renderCities(window.MAP_DATA?.cityNodes||[]); fetchLocalPlaces(); });
    map.on('click', async e => openContext(e.latlng.lat, e.latlng.lng));
    document.addEventListener('change', e=>{ if(e.target?.id==='seaToggle'){ window.SHOW_SEA=!!e.target.checked; renderRoutes(window.ROUTES||[]); } if(e.target?.id==='landToggle'){ window.SHOW_LAND=!!e.target.checked; renderRoutes(window.ROUTES||[]); } if(e.target?.dataset?.layer){ document.body.classList.toggle('hide-'+e.target.dataset.layer, !e.target.checked); } if(e.target?.id==='safetyToggle'){ window.SHOW_SAFETY=!!e.target.checked; renderSafetyCountries(window.MAP_DATA?.safetyCountries||[]); }});
    setTimeout(resize,250);
  }
  function renderLegend(){ const el=document.getElementById('legend'); const keys={war:'war',terror:'terror',disaster:'disaster',election:'election',shipping:'shipping',ai:'AI',commodity:'commodity',energy:'energy',finance:'finance',city:'city'}; el.innerHTML=Object.entries(keys).map(([k,v])=>`<span class="${k}-key"><i style="background:${colors[k]}"></i>${v}</span>`).join(''); }
  function renderRiskRegions(regions){
    riskLayer.clearLayers();
    for(const r of regions||[]){
      const fill = riskFill[r.level] || '#e0184f';
      const opts={pane:'overlayPane',color:fill,weight:2,opacity:.95,fillColor:fill,fillOpacity:r.level==='darkred'?.28:r.level==='red'?.22:.16,className:`risk-poly risk-${r.level||'red'}`};
      const layer = Array.isArray(r.poly) && r.poly.length ? L.polygon(r.poly, opts) : L.rectangle(r.bounds, opts);
      layer.on('click',ev=>{ L.DomEvent.stopPropagation(ev); Renderers.renderRiskRegion(r); }).addTo(riskLayer);
    }
  }
  function renderConflictCountries(countries){
    conflictCountryLayer.clearLayers();
    for(const c of countries||[]){
      const fill=c.color || (c.level==='active-war'||c.level==='active-conflict'?'#ff174f':(c.level==='high-risk'?'#ff7b22':'#ffd447'));
      const fillOpacity=(c.level==='active-war'||c.level==='active-conflict')?.52:(c.level==='high-risk'?.36:.22);
      const layer=L.polygon(c.poly,{color:fill,weight:1.35,opacity:.96,fillColor:fill,fillOpacity,className:`country-conflict country-${c.level||'risk'}`});
      layer.on('click',ev=>{ L.DomEvent.stopPropagation(ev); Renderers.renderCountryConflict ? Renderers.renderCountryConflict(c) : Renderers.renderRiskRegion(c); });
      layer.addTo(conflictCountryLayer);
    }
  }
  function renderSafetyCountries(countries){
    if(map.hasLayer(safetyCountryLayer)) map.removeLayer(safetyCountryLayer);
    safetyCountryLayer.clearLayers();
    if(!window.SHOW_SAFETY) return;
    if(!map.hasLayer(safetyCountryLayer)) safetyCountryLayer.addTo(map);
    for(const c of countries||[]){
      const fill={red:'#ff174f',orange:'#ff7b22',yellow:'#ffd447',green:'#12e680'}[c.level] || '#ffd447';
      const fillOpacity=c.level==='red'?.42:c.level==='orange'?.32:c.level==='yellow'?.20:.10;
      const layer=L.polygon(c.poly,{color:fill,weight:1.0,opacity:.88,fillColor:fill,fillOpacity,className:`country-safety country-safety-${c.level}`});
      layer.on('click',ev=>{ L.DomEvent.stopPropagation(ev); Renderers.renderSafetyCountry ? Renderers.renderSafetyCountry(c) : Renderers.renderSafetyRegion(c); });
      layer.addTo(safetyCountryLayer);
    }
  }
  function renderSafetyRegions(regions){
    if(map.hasLayer(safetyLayer)) map.removeLayer(safetyLayer);
    safetyLayer.clearLayers();
    if(!window.SHOW_SAFETY) return;
    safetyLayer.addTo(map);
    for(const r of regions||[]){
      const fill = {red:'#ff174f', yellow:'#ffd447', green:'#12e680'}[r.level] || '#ffd447';
      const layer = L.polygon(r.poly, { color:fill, weight:1.8, opacity:.85, fillColor:fill, fillOpacity:r.level==='green'?.10:r.level==='yellow'?.16:.21, className:`safety-poly safety-${r.level}` });
      layer.on('click',ev=>{ L.DomEvent.stopPropagation(ev); Renderers.renderSafetyRegion ? Renderers.renderSafetyRegion(r) : Renderers.renderRiskRegion(r); }).addTo(safetyLayer);
    }
  }
  function renderBase(nodes){ nodesLayer.clearLayers(); for(const n of nodes||[]){ const kind=n.kind==='tech'?'ai':n.kind; L.marker([n.lat,n.lng],{icon:icon(kind)}).on('click',ev=>{ L.DomEvent.stopPropagation(ev); Renderers.renderNode(n); }).addTo(nodesLayer); } renderLegend(); }
  function renderCities(cities){ cityLayer.clearLayers(); const z=map.getZoom(); if(z<4.0) return; const bounds=map.getBounds(); const limit=z>=11?900:z>=9?650:z>=7?420:z>=5?220:120; for(const c of (cities||[]).filter(x=>bounds.pad(.55).contains([x.lat,x.lng])).slice(0,limit)){ L.marker([c.lat,c.lng],{icon:icon(c.kind||'city')}).on('click',ev=>{ L.DomEvent.stopPropagation(ev); Renderers.renderLocalPlace ? Renderers.renderLocalPlace(c) : Renderers.renderNode(c); }).addTo(cityLayer); } }

  let localTimer=null, lastLocalKey='';
  function localIcon(kind){ return L.divIcon({ className:'', html:`<div class="local-dot ${kind||'place'}"></div>`, iconSize:[12,12], iconAnchor:[6,6] }); }
  function renderLocalPlaces(places){
    localLayer.clearLayers();
    const z=map.getZoom(); if(z<6) return;
    for(const p of (places||[]).slice(0,z>=12?220:z>=10?160:90)){
      L.marker([p.lat,p.lng],{icon:localIcon(p.kind)}).on('click',ev=>{ L.DomEvent.stopPropagation(ev); Renderers.renderLocalPlace ? Renderers.renderLocalPlace(p) : Renderers.renderNode(p); }).addTo(localLayer);
    }
  }
  function fetchLocalPlaces(){
    clearTimeout(localTimer);
    localTimer=setTimeout(async()=>{
      if(!map || map.getZoom()<6){ localLayer.clearLayers(); return; }
      const b=map.getBounds();
      const key=[b.getSouth().toFixed(2),b.getWest().toFixed(2),b.getNorth().toFixed(2),b.getEast().toFixed(2),Math.floor(map.getZoom())].join(',');
      if(key===lastLocalKey) return; lastLocalKey=key;
      try{
        const url=`/api/local-places?south=${b.getSouth()}&west=${b.getWest()}&north=${b.getNorth()}&east=${b.getEast()}&zoom=${map.getZoom()}`;
        const d=await fetch(url).then(r=>r.json());
        renderLocalPlaces(d.places||[]);
      }catch(e){}
    },550);
  }

  function renderEvents(events, flashIds=new Set()){ eventsLayer.clearLayers(); const z=map.getZoom(); const bounds=map.getBounds(); const filtered=(events||[]).filter(e=> currentFilter==='all' || e.kind===currentFilter || (currentFilter==='ai' && e.kind==='tech')); const visible=filtered.filter(e=>z<4.5 || bounds.pad(.55).contains([e.lat,e.lng])).slice(0,z>=10?900:z>=8?650:z>=6?460:300); for(const e of visible){ const kind=e.kind==='tech'?'ai':e.kind; L.marker([e.lat,e.lng],{icon:icon(kind, flashIds.has(e.id))}).on('click',ev=>{ L.DomEvent.stopPropagation(ev); Renderers.renderEvent(e); }).addTo(eventsLayer); } }
  function renderRoutes(routes){
    if(map.hasLayer(seaLayer)) map.removeLayer(seaLayer);
    if(map.hasLayer(landLayer)) map.removeLayer(landLayer);
    seaLayer.clearLayers(); landLayer.clearLayers();
    if(window.SHOW_SEA) seaLayer.addTo(map);
    if(window.SHOW_LAND) landLayer.addTo(map);
    if(!window.SHOW_SEA && !window.SHOW_LAND) return;
    const add = r => { const layer=r.type==='sea'?seaLayer:landLayer; const pts=r.points.map(p=>[p[0],p[1]]); const cls=r.type==='sea'?'moving-route sea-route':'moving-route land-route'; L.polyline(pts,{color:r.color,weight:r.type==='sea'?8:7,opacity:.18,className:'route-shadow'}).on('click',ev=>{ L.DomEvent.stopPropagation(ev); Renderers.renderRoute(r); }).addTo(layer); L.polyline(pts,{color:r.color,weight:r.type==='sea'?3:3,opacity:.92,className:cls}).on('click',ev=>{ L.DomEvent.stopPropagation(ev); Renderers.renderRoute(r); }).addTo(layer); if(map.getZoom()>=4.2){ const mid=pts[Math.floor(pts.length/2)]; L.marker(mid,{icon:L.divIcon({className:'route-label',html:`${r.name}<br><span>${r.goods}</span>`,iconSize:null})}).on('click',ev=>{ L.DomEvent.stopPropagation(ev); Renderers.renderRoute(r); }).addTo(layer); } };
    for(const r of routes||[]){ if(r.type==='sea' && window.SHOW_SEA) add(r); if(r.type==='land' && window.SHOW_LAND) add(r); }
  }
  function setData(mapData,state){ window.MAP_DATA=mapData; window.ROUTES=mapData.routes||[]; window.SHOW_SEA=false; window.SHOW_LAND=false; window.SHOW_SAFETY=true; if(map.hasLayer(seaLayer)) map.removeLayer(seaLayer); if(map.hasLayer(landLayer)) map.removeLayer(landLayer); renderConflictCountries(mapData.conflictCountries||[]); renderSafetyCountries(mapData.safetyCountries||[]); renderBase(mapData.nodes); renderCities(mapData.cityNodes); fetchLocalPlaces(); renderRoutes(mapData.routes); renderEvents(state?.events||[]); setTimeout(resize,250); }
  async function openContext(lat,lng,zoom=null){
    if(map && zoom && Number.isFinite(Number(lat)) && Number.isFinite(Number(lng))) map.setView([Number(lat),Number(lng)], Math.max(map.getZoom(), zoom));
    const d=await fetch(`/api/context?lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(lng)}`).then(r=>r.json());
    try{ const rev=await fetch(`/api/reverse?lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(lng)}`).then(r=>r.json()); d.reverse=rev; }catch(_){}
    Renderers.renderContext(d);
  }
  function newEvent(e){ if(!e || lastEventIds.has(e.id)) return; lastEventIds.add(e.id); showToast(Renderers.plainEventTitle ? Renderers.plainEventTitle(e) : e.title); sound(); renderEvents(window.APP_STATE?.events||[], new Set([e.id])); }
  function showToast(text){ const t=document.getElementById('toast'); t.innerHTML='<div class="a-title">LIVE ALERT</div><div class="a-meta">'+String(text||'Source-backed event').slice(0,190)+'</div>'; t.classList.remove('show'); void t.offsetWidth; t.classList.add('show'); setTimeout(()=>t.classList.remove('show'),14000); }
  function goHome(){ if(map) { Panels?.closeAll?.(); map.setView([20,12],2.75); setTimeout(resize,120); } }
  function resize(){ if(!map) return; map.invalidateSize(); setTimeout(()=>map.invalidateSize(),220); }
  return { init,setData,newEvent,resize,goHome,openContext,renderEvents,renderCities,renderRoutes,renderRiskRegions,renderSafetyRegions,renderConflictCountries,renderSafetyCountries };
})();
