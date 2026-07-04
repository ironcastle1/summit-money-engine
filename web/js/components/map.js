window.MoneyMap = (() => {
  let map, nodesLayer, cityLayer, eventsLayer, seaLayer, landLayer, flowLayer;
  let currentFilter='all';
  const colors={war:'#ff326a',disaster:'#ff7b22',election:'#a871ff',shipping:'#00d8ff',port:'#00d8ff',tech:'#a871ff',energy:'#00ff87',commodity:'#ffd94a',finance:'#3ea0ff',city:'#7aa7ff',risk:'#ff326a'};
  function sound(){ try{ const A=window.AudioContext||window.webkitAudioContext; const ctx=new A(); const o=ctx.createOscillator(); const g=ctx.createGain(); o.type='sine'; o.frequency.value=880; g.gain.value=.035; o.connect(g); g.connect(ctx.destination); o.start(); setTimeout(()=>{o.stop();ctx.close();},160); }catch(e){} }
  function icon(kind, flash=false){ return L.divIcon({ className:'', html:`<div class="node-dot ${kind} ${flash?'flash':''}"></div>`, iconSize:[18,18], iconAnchor:[9,9] }); }
  function init(){
    map=L.map('map',{worldCopyJump:false,zoomSnap:.25,zoomDelta:.5,minZoom:2.75,maxZoom:14,zoomControl:true,maxBounds:[[-78,-180],[78,180]],maxBoundsViscosity:1}).setView([24,18],2.75);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',{subdomains:'abcd',noWrap:true,bounds:[[-85,-180],[85,180]],attribution:'&copy; OpenStreetMap &copy; CARTO'}).addTo(map);
    nodesLayer=L.layerGroup().addTo(map); cityLayer=L.layerGroup().addTo(map); eventsLayer=L.layerGroup().addTo(map); seaLayer=L.layerGroup().addTo(map); landLayer=L.layerGroup().addTo(map); flowLayer=L.layerGroup().addTo(map);
    map.on('zoomend moveend',()=>{ renderEvents(window.APP_STATE?.events||[]); renderCities(window.MAP_DATA?.cityNodes||[]); });
    map.on('click', async e => { const d=await fetch(`/api/context?lat=${e.latlng.lat}&lng=${e.latlng.lng}`).then(r=>r.json()); try{ const rev=await fetch(`/api/reverse?lat=${e.latlng.lat}&lng=${e.latlng.lng}`).then(r=>r.json()); d.reverse=rev; }catch(_){} Renderers.renderContext(d); });
    document.querySelectorAll('[data-filter]').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('[data-filter]').forEach(x=>x.classList.remove('active')); b.classList.add('active'); currentFilter=b.dataset.filter; renderEvents(window.APP_STATE?.events||[]);}));
    document.querySelectorAll('[data-layer]').forEach(b=>b.addEventListener('click',()=>{b.classList.toggle('active'); const type=b.dataset.layer; if(type==='sea') window.SHOW_SEA=b.classList.contains('active'); if(type==='land') window.SHOW_LAND=b.classList.contains('active'); renderRoutes(window.ROUTES||[]);}));
    setTimeout(()=>map.invalidateSize(),250);
  }
  function renderLegend(){
    const el=document.getElementById('legend');
    el.innerHTML=Object.entries({war:'war',disaster:'disaster',election:'election',shipping:'shipping',tech:'tech',commodity:'commodity',energy:'energy',finance:'finance',city:'city'}).map(([k,v])=>`<span><i style="background:${colors[k]}"></i>${v}</span>`).join('');
  }
  function renderBase(nodes){
    nodesLayer.clearLayers();
    for(const n of nodes||[]){
      L.marker([n.lat,n.lng],{icon:icon(n.kind)}).on('click',()=>Renderers.renderNode(n)).addTo(nodesLayer);
    }
    renderLegend();
  }
  function renderCities(cities){
    cityLayer.clearLayers();
    if(map.getZoom()<5.25) return;
    const bounds=map.getBounds();
    for(const c of (cities||[]).filter(x=>bounds.pad(.2).contains([x.lat,x.lng])).slice(0,120)){
      L.marker([c.lat,c.lng],{icon:icon(c.kind||'city')}).on('click',()=>Renderers.renderNode(c)).addTo(cityLayer);
    }
  }
  function renderEvents(events, flashIds=new Set()){
    eventsLayer.clearLayers();
    const z=map.getZoom(); const bounds=map.getBounds();
    const filtered=(events||[]).filter(e=>currentFilter==='all'||e.kind===currentFilter).filter(e=>z>=5 || !e.baseline || ['war','disaster','shipping','energy','election'].includes(e.kind));
    const visible=filtered.filter(e=>z<5 || bounds.pad(.35).contains([e.lat,e.lng])).slice(0,z>=7?450:180);
    for(const e of visible){ L.marker([e.lat,e.lng],{icon:icon(e.kind, flashIds.has(e.id))}).on('click',()=>Renderers.renderEvent(e)).addTo(eventsLayer); }
  }
  function interpolate(points,t){
    const segs=[]; let total=0;
    for(let i=0;i<points.length-1;i++){ const a=points[i],b=points[i+1],d=Math.hypot((a[0]-b[0])*1.15,a[1]-b[1]); segs.push({a,b,d}); total+=d; }
    let x=(t%1)*total;
    for(const s of segs){ if(x<=s.d){ const r=x/s.d; return [s.a[0]+(s.b[0]-s.a[0])*r, s.a[1]+(s.b[1]-s.a[1])*r]; } x-=s.d; }
    return points[0];
  }
  function renderRoutes(routes){
    seaLayer.clearLayers(); landLayer.clearLayers(); flowLayer.clearLayers();
    const add = r => {
      const layer=r.type==='sea'?seaLayer:landLayer; const pts=r.points.map(p=>[p[0],p[1]]); const cls=r.type==='sea'?'route-sea':'route-land';
      L.polyline(pts,{color:r.color,weight:r.type==='sea'?4:3.5,opacity:.92,className:cls}).on('click',()=>Renderers.renderRoute(r)).addTo(layer);
      for(let k=0;k<4;k++){ const m=L.marker(pts[0],{icon:L.divIcon({className:'',html:'<div class="flow-dot"></div>',iconSize:[9,9],iconAnchor:[4,4]})}).addTo(flowLayer); m._route={pts,offset:k/4}; }
    };
    for(const r of routes||[]){ if(r.type==='sea' && window.SHOW_SEA) add(r); if(r.type==='land' && window.SHOW_LAND) add(r); }
  }
  let anim=0; function animate(){ anim=(anim+0.00055)%1; flowLayer?.eachLayer(m=>{ if(m._route){ const p=interpolate(m._route.pts, anim+m._route.offset); m.setLatLng(p); }}); requestAnimationFrame(animate); }
  function setData(mapData,state){ window.MAP_DATA=mapData; window.ROUTES=mapData.routes; window.SHOW_SEA=true; window.SHOW_LAND=true; document.querySelector('[data-layer="sea"]')?.classList.add('active'); document.querySelector('[data-layer="land"]')?.classList.add('active'); renderBase(mapData.nodes); renderCities(mapData.cityNodes); renderRoutes(mapData.routes); renderEvents(state?.events||[]); setTimeout(()=>map.invalidateSize(),250); animate(); }
  function newEvent(e){ showToast(e.title); sound(); renderEvents(window.APP_STATE?.events||[], new Set([e.id])); }
  function showToast(text){ const t=document.getElementById('toast'); t.textContent='NEW MAP EVENT: '+String(text||'').slice(0,160); t.classList.remove('show'); void t.offsetWidth; t.classList.add('show'); }
  function resize(){ map?.invalidateSize(); setTimeout(()=>map?.invalidateSize(),150); }
  return { init,setData,newEvent,resize,renderEvents,renderCities };
})();
