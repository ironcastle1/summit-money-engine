window.MoneyMap = (() => {
  let map, nodesLayer, eventsLayer, seaLayer, landLayer, flowLayer;
  let currentFilter='all';
  let audioReady=false;
  const colors={war:'#ff326a',disaster:'#ff7b22',election:'#a871ff',shipping:'#00d8ff',port:'#00d8ff',tech:'#a871ff',energy:'#00ff87',commodity:'#ffd94a',finance:'#3ea0ff',risk:'#ff326a'};
  function sound(){
    try{
      const A=window.AudioContext||window.webkitAudioContext; const ctx=new A(); const o=ctx.createOscillator(); const g=ctx.createGain();
      o.type='sine'; o.frequency.value=880; g.gain.value=.04; o.connect(g); g.connect(ctx.destination); o.start(); setTimeout(()=>{o.stop();ctx.close();},180);
    }catch(e){}
  }
  function icon(kind, flash=false){
    return L.divIcon({ className:'', html:`<div class="node-dot ${kind} ${flash?'flash':''}"></div>`, iconSize:[18,18], iconAnchor:[9,9] });
  }
  function popup(item){
    return `<div class="popup"><h3>${item.name||item.title}</h3><p>${item.note||item.summary||''}</p>${item.watch?`<p><b>Watch:</b> ${item.watch.join(', ')}</p>`:''}${item.source?`<p><b>Source:</b> ${item.source}</p>`:''}${item.url&&item.url!=='#'?`<a target="_blank" href="${item.url}">open source</a>`:''}</div>`;
  }
  function init(){
    map=L.map('map',{worldCopyJump:false,minZoom:2,maxZoom:13,zoomControl:true,maxBounds:[[-82,-180],[82,180]],maxBoundsViscosity:1}).setView([28,20],3);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png',{subdomains:'abcd',noWrap:true,bounds:[[-85,-180],[85,180]],attribution:'&copy; OpenStreetMap &copy; CARTO'}).addTo(map);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png',{subdomains:'abcd',noWrap:true,bounds:[[-85,-180],[85,180]],pane:'markerPane'}).addTo(map);
    nodesLayer=L.layerGroup().addTo(map); eventsLayer=L.layerGroup().addTo(map); seaLayer=L.layerGroup().addTo(map); landLayer=L.layerGroup().addTo(map); flowLayer=L.layerGroup().addTo(map);
    map.on('zoomend',()=>updateLocalVisibility(window.APP_STATE));
    map.on('click', async e => { const d=await fetch(`/api/context?lat=${e.latlng.lat}&lng=${e.latlng.lng}`).then(r=>r.json()); Renderers.renderContext(d); });
    document.querySelectorAll('[data-filter]').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('[data-filter]').forEach(x=>x.classList.remove('active')); b.classList.add('active'); currentFilter=b.dataset.filter; renderEvents(window.APP_STATE?.events||[]);}));
    document.querySelectorAll('[data-layer]').forEach(b=>b.addEventListener('click',()=>{b.classList.toggle('active'); const type=b.dataset.layer; if(type==='sea') window.SHOW_SEA=b.classList.contains('active'); if(type==='land') window.SHOW_LAND=b.classList.contains('active'); renderRoutes(window.ROUTES||[]);}));
  }
  function renderLegend(){
    const el=document.getElementById('legend');
    el.innerHTML=Object.entries({war:'war',disaster:'disaster',election:'election',shipping:'shipping',tech:'tech',commodity:'commodity',energy:'energy'}).map(([k,v])=>`<span><i style="background:${colors[k]}"></i>${v}</span>`).join('');
  }
  function renderBase(nodes){
    nodesLayer.clearLayers();
    for(const n of nodes||[]){
      L.marker([n.lat,n.lng],{icon:icon(n.kind)}).bindPopup(popup(n)).addTo(nodesLayer);
    }
    renderLegend();
  }
  function renderEvents(events, flashIds=new Set()){
    eventsLayer.clearLayers();
    const z=map.getZoom();
    const filtered=(events||[]).filter(e=>currentFilter==='all'||e.kind===currentFilter).filter(e=>z>=5 || ['war','disaster','shipping','energy','election'].includes(e.kind));
    for(const e of filtered){
      L.marker([e.lat,e.lng],{icon:icon(e.kind, flashIds.has(e.id))}).bindPopup(popup(e)).addTo(eventsLayer);
    }
  }
  function interpolate(points,t){
    const segs=[]; let total=0;
    for(let i=0;i<points.length-1;i++){ const a=points[i],b=points[i+1],d=Math.hypot(a[0]-b[0],a[1]-b[1]); segs.push({a,b,d}); total+=d; }
    let x=(t%1)*total;
    for(const s of segs){ if(x<=s.d){ const r=x/s.d; return [s.a[0]+(s.b[0]-s.a[0])*r, s.a[1]+(s.b[1]-s.a[1])*r]; } x-=s.d; }
    return points[0];
  }
  function renderRoutes(routes){
    seaLayer.clearLayers(); landLayer.clearLayers(); flowLayer.clearLayers();
    const add = r => {
      const layer=r.type==='sea'?seaLayer:landLayer; const pts=r.points.map(p=>[p[0],p[1]]);
      L.polyline(pts,{color:r.color,weight:3.5,opacity:.92}).bindTooltip(`<b>${r.name}</b><br>${r.goods}<br>Watch: ${r.watch.join(', ')}`,{sticky:true,className:'route-label'}).addTo(layer);
      for(let k=0;k<3;k++){ const m=L.marker(pts[0],{icon:L.divIcon({className:'',html:'<div class="flow-dot"></div>',iconSize:[9,9],iconAnchor:[4,4]})}).addTo(flowLayer); m._route={pts,offset:k/3}; }
    };
    for(const r of routes||[]){ if(r.type==='sea' && window.SHOW_SEA) add(r); if(r.type==='land' && window.SHOW_LAND) add(r); }
  }
  let anim=0; function animate(){ anim=(anim+0.002)%1; flowLayer?.eachLayer(m=>{ if(m._route){ const p=interpolate(m._route.pts, anim+m._route.offset); m.setLatLng(p); }}); requestAnimationFrame(animate); }
  function updateLocalVisibility(state){ renderEvents(state?.events||[]); }
  function setData(mapData,state){ window.ROUTES=mapData.routes; window.SHOW_SEA=true; window.SHOW_LAND=true; renderBase(mapData.nodes); renderRoutes(mapData.routes); renderEvents(state?.events||[]); setTimeout(()=>map.invalidateSize(),100); animate(); }
  function newEvent(e){ showToast(e.title); sound(); renderEvents(window.APP_STATE?.events||[], new Set([e.id])); }
  function showToast(text){ const t=document.getElementById('toast'); t.textContent='NEW: '+text; t.classList.remove('show'); void t.offsetWidth; t.classList.add('show'); }
  function resize(){ map?.invalidateSize(); }
  return { init,setData,newEvent,resize,renderEvents };
})();
