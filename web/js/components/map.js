window.MoneyMap = (() => {
  let map, nodesLayer, cityLayer, eventsLayer, seaLayer, landLayer;
  let currentFilter='all';
  const colors={war:'#ff326a',disaster:'#ff7b22',election:'#a871ff',shipping:'#00d8ff',port:'#00d8ff',tech:'#a871ff',energy:'#00ff87',commodity:'#ffd94a',finance:'#3ea0ff',city:'#7aa7ff',risk:'#ff326a'};
  function sound(){ try{ const A=window.AudioContext||window.webkitAudioContext; const ctx=new A(); const o=ctx.createOscillator(); const g=ctx.createGain(); o.type='triangle'; o.frequency.value=740; g.gain.value=.04; o.connect(g); g.connect(ctx.destination); o.start(); setTimeout(()=>{o.frequency.value=980;},90); setTimeout(()=>{o.stop();ctx.close();},210); }catch(e){} }
  function icon(kind, flash=false){ return L.divIcon({ className:'', html:`<div class="node-dot ${kind} ${flash?'flash':''}"></div>`, iconSize:[18,18], iconAnchor:[9,9] }); }
  function init(){
    map=L.map('map',{worldCopyJump:false,zoomSnap:.25,zoomDelta:.5,minZoom:3,maxZoom:15,zoomControl:true,maxBounds:[[-82,-180],[82,180]],maxBoundsViscosity:.95}).setView([25,15],3);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',{subdomains:'abcd',noWrap:true,bounds:[[-85,-180],[85,180]],attribution:'&copy; OpenStreetMap &copy; CARTO'}).addTo(map);
    nodesLayer=L.layerGroup().addTo(map); cityLayer=L.layerGroup().addTo(map); eventsLayer=L.layerGroup().addTo(map); seaLayer=L.layerGroup().addTo(map); landLayer=L.layerGroup().addTo(map);
    map.on('zoomend moveend',()=>{ renderEvents(window.APP_STATE?.events||[]); renderCities(window.MAP_DATA?.cityNodes||[]); resize(); });
    map.on('click', async e => { const d=await fetch(`/api/context?lat=${e.latlng.lat}&lng=${e.latlng.lng}`).then(r=>r.json()); try{ const rev=await fetch(`/api/reverse?lat=${e.latlng.lat}&lng=${e.latlng.lng}`).then(r=>r.json()); d.reverse=rev; }catch(_){} Renderers.renderContext(d); });
    document.querySelectorAll('[data-filter]').forEach(b=>b.addEventListener('click',()=>{ document.querySelectorAll('[data-filter]').forEach(x=>x.classList.remove('active')); b.classList.add('active'); currentFilter=b.dataset.filter; renderEvents(window.APP_STATE?.events||[]); }));
    document.querySelectorAll('[data-layer]').forEach(b=>b.addEventListener('click',()=>{ b.classList.toggle('active'); const type=b.dataset.layer; if(type==='sea') window.SHOW_SEA=b.classList.contains('active'); if(type==='land') window.SHOW_LAND=b.classList.contains('active'); renderRoutes(window.ROUTES||[]); }));
    setTimeout(resize,250);
  }
  function renderLegend(){
    const el=document.getElementById('legend');
    el.innerHTML='<div class="key-row" style="display:contents"></div>'+Object.entries({war:'war',disaster:'disaster',election:'election',shipping:'shipping',tech:'tech',commodity:'commodity',energy:'energy',finance:'finance',city:'city'}).map(([k,v])=>`<span><i style="background:${colors[k]}"></i>${v}</span>`).join('');
  }
  function renderBase(nodes){ nodesLayer.clearLayers(); for(const n of nodes||[]){ L.marker([n.lat,n.lng],{icon:icon(n.kind)}).on('click',()=>Renderers.renderNode(n)).addTo(nodesLayer); } renderLegend(); }
  function renderCities(cities){
    cityLayer.clearLayers();
    const z=map.getZoom(); if(z<4.6) return;
    const bounds=map.getBounds(); const limit=z>=8?420:z>=6?220:90;
    for(const c of (cities||[]).filter(x=>bounds.pad(.25).contains([x.lat,x.lng])).slice(0,limit)){
      L.marker([c.lat,c.lng],{icon:icon(c.kind||'city')}).on('click',()=>Renderers.renderNode(c)).addTo(cityLayer);
    }
  }
  function renderEvents(events, flashIds=new Set()){
    eventsLayer.clearLayers(); const z=map.getZoom(); const bounds=map.getBounds();
    const filtered=(events||[]).filter(e=>currentFilter==='all'||e.kind===currentFilter);
    const visible=filtered.filter(e=>z<5 || bounds.pad(.4).contains([e.lat,e.lng])).slice(0,z>=8?900:z>=6?520:300);
    for(const e of visible){ L.marker([e.lat,e.lng],{icon:icon(e.kind, flashIds.has(e.id))}).on('click',()=>Renderers.renderEvent(e)).addTo(eventsLayer); }
  }
  function renderRoutes(routes){
    seaLayer.clearLayers(); landLayer.clearLayers();
    const add = r => {
      const layer=r.type==='sea'?seaLayer:landLayer; const pts=r.points.map(p=>[p[0],p[1]]); const flowClass=r.type==='sea'?'route-flow route-sea':'route-flow route-land';
      L.polyline(pts,{color:r.color,weight:r.type==='sea'?6:5,opacity:.42,className:'route-base'}).on('click',()=>Renderers.renderRoute(r)).addTo(layer);
      L.polyline(pts,{color:r.color,weight:r.type==='sea'?3:3,opacity:.98,dashArray:'16 18',className:flowClass}).on('click',()=>Renderers.renderRoute(r)).addTo(layer);
      const mid=pts[Math.floor(pts.length/2)];
      L.marker(mid,{icon:L.divIcon({className:'route-label',html:`${r.name}<br><span>${r.goods}</span>`,iconSize:null})}).on('click',()=>Renderers.renderRoute(r)).addTo(layer);
    };
    for(const r of routes||[]){ if(r.type==='sea' && window.SHOW_SEA) add(r); if(r.type==='land' && window.SHOW_LAND) add(r); }
  }
  function setData(mapData,state){ window.MAP_DATA=mapData; window.ROUTES=mapData.routes; window.SHOW_SEA=true; window.SHOW_LAND=true; document.querySelector('[data-layer="sea"]')?.classList.add('active'); document.querySelector('[data-layer="land"]')?.classList.add('active'); renderBase(mapData.nodes); renderCities(mapData.cityNodes); renderRoutes(mapData.routes); renderEvents(state?.events||[]); setTimeout(resize,250); }
  function newEvent(e){ showToast(e.title); sound(); renderEvents(window.APP_STATE?.events||[], new Set([e.id])); }
  function showToast(text){ const t=document.getElementById('toast'); t.textContent='NEW EVENT: '+String(text||'').slice(0,160); t.classList.remove('show'); void t.offsetWidth; t.classList.add('show'); }
  function resize(){ if(!map) return; map.invalidateSize(); setTimeout(()=>map.invalidateSize(),180); }
  return { init,setData,newEvent,resize,renderEvents,renderCities };
})();
