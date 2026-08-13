const GROUP_COLORS = {
  conflict: '#ff4d4d', politics: '#b96cff', sanctions: '#ff9f36', shipping: '#19d7f0',
  energy: '#ffd15a', cyber: '#ff55c8', market: '#43e69b', supply: '#58a7ff', other: '#9bb7c7',
};
const GROUP_KEYS = ['conflict','politics','sanctions','shipping','energy','cyber','market','supply','other'];

export class MapRenderer {
  constructor(map, onSelect) {
    this.map = map;
    this.onSelect = onSelect;
    this.reference = null;
    this.events = [];
    this.layers = {
      events: true, conflict: true, politics: true, sanctions: true, shipping: true,
      energy: true, cyber: true, market: true, supply: true, other: true,
      alerts: true, heatmap: true, nodes: true, ports: true, routes: true, labels: true,
    };
    this.handlersBound = false;
    this.labelRoot = this._ensureLabelRoot();
    this.map.setOnStyleReady(() => this.syncAll());
    this.map.setOnChange(() => this.updatePositions());
  }

  setReference(reference) { this.reference = reference; this.syncAll(); }
  setEvents(events) { this.events = events || []; this.syncEvents(); this.syncLabels(); }
  setLayers(layers) { this.layers = { ...this.layers, ...layers }; this.applyVisibility(); this.syncLabels(); }
  updatePositions() { this._positionLabels(); }

  syncAll() {
    if (this.map.isFallback()) { this.syncFallback(); return; }
    const gl = this.map.getMap();
    if (!gl || !this.map.isReady()) return;
    this.syncRoutes();
    this.syncNodes();
    this.syncPorts();
    this.syncCityLights();
    this.syncEvents();
    this.bindHandlers();
    this.applyVisibility();
    this.syncLabels();
  }

  syncRoutes() {
    if (!this.reference) return;
    const features = (this.reference.routes || []).map((route, index) => ({
      type: 'Feature', id: index,
      properties: { name: route.properties?.name || 'Shipping route', importance: Number(route.properties?.importance || 0) },
      geometry: { type: 'LineString', coordinates: route.geometry?.coordinates || [] },
    })).filter(feature => feature.geometry.coordinates.length >= 2);
    this.setSource('merlin-routes', fc(features));
    this.addLayer({ id: 'merlin-routes-glow', type: 'line', source: 'merlin-routes', paint: {
      'line-color': '#00d9ff', 'line-width': ['interpolate', ['linear'], ['zoom'], 1, 2.8, 5, 6.5], 'line-opacity': 0.11, 'line-blur': 5.5,
    }});
    this.addLayer({ id: 'merlin-routes-line', type: 'line', source: 'merlin-routes', paint: {
      'line-color': ['case', ['>=', ['get', 'importance'], 90], '#28e8ff', '#1599c2'],
      'line-width': ['interpolate', ['linear'], ['zoom'], 1, 0.7, 4, 1.4, 7, 2.1],
      'line-opacity': ['interpolate', ['linear'], ['zoom'], 1, 0.48, 4, 0.78], 'line-dasharray': [2, 2.2],
    }});
  }

  syncNodes() {
    if (!this.reference) return;
    const features = (this.reference.strategicNodes || []).filter(n => finite(n.lat,n.lon)).map((node, index) => pointFeature(index,node.lon,node.lat,{
      name:node.name,type:node.type||'node',importance:Number(node.importance||0),region:node.regionId||'',
    }));
    this.setSource('merlin-nodes', fc(features));
    this.addLayer({ id:'merlin-nodes-halo', type:'circle', source:'merlin-nodes', minzoom:1.25, paint:{
      'circle-radius':['interpolate',['linear'],['zoom'],1,7,6,14], 'circle-color':['match',['get','type'],'energy-zone','#ffd15a','security-zone','#ff8b55','#f0ba48'], 'circle-opacity':0.13, 'circle-blur':0.58,
    }});
    this.addLayer({ id:'merlin-nodes-core', type:'circle', source:'merlin-nodes', minzoom:1.25, paint:{
      'circle-radius':['interpolate',['linear'],['zoom'],1,2.6,6,5.2], 'circle-color':['match',['get','type'],'energy-zone','#ffd15a','security-zone','#ff8b55','#f0ba48'], 'circle-opacity':0.98,
      'circle-stroke-color':'#fff1ba','circle-stroke-width':0.9,
    }});
  }

  syncPorts() {
    if (!this.reference) return;
    const features = (this.reference.ports || []).filter(port => Number(port.importance || 0) >= 68).map((port,index)=>{
      const lat=Number(port.coordinates?.lat),lon=Number(port.coordinates?.lon); if(!finite(lat,lon))return null;
      return pointFeature(index,lon,lat,{name:port.name,country:port.country||'',importance:Number(port.importance||0)});
    }).filter(Boolean);
    this.setSource('merlin-ports',fc(features));
    this.addLayer({id:'merlin-ports-halo',type:'circle',source:'merlin-ports',minzoom:1.45,paint:{'circle-radius':['interpolate',['linear'],['zoom'],1,4.5,6,9],'circle-color':'#12dff4','circle-opacity':0.09,'circle-blur':0.72}});
    this.addLayer({id:'merlin-ports-core',type:'circle',source:'merlin-ports',minzoom:1.45,paint:{'circle-radius':['interpolate',['linear'],['zoom'],1,1.9,6,3.8],'circle-color':'#17d6f1','circle-opacity':0.92,'circle-stroke-color':'#b9f9ff','circle-stroke-width':0.75}});
  }

  syncCityLights() {
    if (!this.reference) return;
    const cities=(this.reference.cities||[]).filter(c=>finite(c.lat,c.lon)).map((c,index)=>pointFeature(index,c.lon,c.lat,{name:c.name,country:c.country||'',kind:c.kind||''}));
    this.setSource('merlin-city-lights',fc(cities));
    this.addLayer({id:'merlin-city-glow',type:'circle',source:'merlin-city-lights',minzoom:1.2,paint:{
      'circle-radius':['interpolate',['linear'],['zoom'],1,1.4,3,2.4,6,4.2], 'circle-color':'#f2b54b','circle-opacity':['interpolate',['linear'],['zoom'],1,.15,3,.28,6,.18], 'circle-blur':0.72,
    }});
    this.addLayer({id:'merlin-city-core',type:'circle',source:'merlin-city-lights',minzoom:2.6,paint:{'circle-radius':1.1,'circle-color':'#ffcf71','circle-opacity':0.48}});
  }

  syncEvents() {
    if (this.map.isFallback()) { this.syncFallback(); return; }
    const gl=this.map.getMap(); if(!gl||!this.map.isReady())return;
    const features=this.events.map((item,index)=>{
      const lat=Number(item.location?.lat),lon=Number(item.location?.lon); if(!finite(lat,lon))return null;
      const overlay=overlayGroup(item); const text=`${item.title||''} ${item.summary||''}`.toLowerCase();
      const airMaritime=/airspace|aviation|air defence|air defense|flight restriction|naval|maritime|vessel|tanker|ship|strait|sea lane|port closure|drone|missile/.test(text);
      return pointFeature(index,lon,lat,{id:item.id||String(index),title:item.title||'',score:Number(item.signalScore||0),urgency:String(item.urgency||'WATCH').toUpperCase(),category:String(item.category||'other'),overlay,airMaritime:airMaritime?1:0,location:item.location?.name||''});
    }).filter(Boolean);
    this.setSource('merlin-events',fc(features));
    this.addLayer({id:'merlin-events-heat',type:'heatmap',source:'merlin-events',maxzoom:5.8,paint:{
      'heatmap-weight':['interpolate',['linear'],['get','score'],40,.12,100,1], 'heatmap-intensity':['interpolate',['linear'],['zoom'],1,.22,5,.82],
      'heatmap-radius':['interpolate',['linear'],['zoom'],1,16,5,38], 'heatmap-opacity':['interpolate',['linear'],['zoom'],1,.28,5,.08],
      'heatmap-color':['interpolate',['linear'],['heatmap-density'],0,'rgba(0,0,0,0)',.25,'rgba(0,157,255,.25)',.55,'rgba(255,174,50,.42)',.78,'rgba(255,93,54,.6)',1,'rgba(255,35,55,.8)'],
    }});
    this.addLayer({id:'merlin-events-halo',type:'circle',source:'merlin-events',paint:{
      'circle-radius':['interpolate',['linear'],['get','score'],40,7,70,12,100,20], 'circle-color':groupColorExpression(), 'circle-opacity':.18, 'circle-blur':.66,
    }});
    this.addLayer({id:'merlin-events-core',type:'circle',source:'merlin-events',paint:{
      'circle-radius':['interpolate',['linear'],['zoom'],1,3.4,4,5.2,7,7], 'circle-color':groupColorExpression(), 'circle-opacity':.98,
      'circle-stroke-color':['case',['>=',['get','score'],80],'#ffffff','#d6edf4'],'circle-stroke-width':['case',['>=',['get','score'],80],1.35,.75],
    }});
    this.addLayer({id:'merlin-air-alert-ring',type:'circle',source:'merlin-events',filter:['==',['get','airMaritime'],1],paint:{
      'circle-radius':['interpolate',['linear'],['zoom'],1,7.5,5,11], 'circle-color':'rgba(0,0,0,0)', 'circle-stroke-color':'#63dfff', 'circle-stroke-width':1.2, 'circle-stroke-opacity':.58,
    }});
    this.applyVisibility();
  }

  bindHandlers() {
    const gl=this.map.getMap(); if(!gl||this.handlersBound)return; this.handlersBound=true;
    gl.on('click','merlin-events-core',event=>{const id=event.features?.[0]?.properties?.id;const item=this.events.find(row=>String(row.id)===String(id));if(item)this.onSelect(item)});
    gl.on('click','merlin-nodes-core',event=>{const f=event.features?.[0];if(!f)return;const[lon,lat]=f.geometry.coordinates;this.map.focus(lat,lon,Math.max(this.map.zoom,4.5))});
    gl.on('click','merlin-ports-core',event=>{const f=event.features?.[0];if(!f)return;const[lon,lat]=f.geometry.coordinates;this.map.focus(lat,lon,Math.max(this.map.zoom,5))});
    for(const layer of ['merlin-events-core','merlin-nodes-core','merlin-ports-core']){
      gl.on('mouseenter',layer,()=>{if(gl.getCanvas)gl.getCanvas().style.cursor='pointer'});gl.on('mouseleave',layer,()=>{if(gl.getCanvas)gl.getCanvas().style.cursor=''});
    }
  }

  applyVisibility() {
    if(this.map.isFallback()){this.syncFallback();return}
    const gl=this.map.getMap();if(!gl)return;
    const allowed=GROUP_KEYS.filter(k=>this.layers[k]!==false);
    const groupFilter=allowed.length===GROUP_KEYS.length?null:['match',['get','overlay'],allowed,true,false];
    for(const id of ['merlin-events-heat','merlin-events-halo','merlin-events-core']){
      try{if(gl.getLayer(id)){gl.setLayoutProperty(id,'visibility',this.layers.events?'visible':'none');gl.setFilter?.(id,groupFilter)}}catch{}
    }
    this.toggleGroup(['merlin-air-alert-ring'],this.layers.events&&this.layers.alerts);
    this.toggleGroup(['merlin-events-heat'],this.layers.events&&this.layers.heatmap);
    this.toggleGroup(['merlin-nodes-halo','merlin-nodes-core'],this.layers.nodes);
    this.toggleGroup(['merlin-ports-halo','merlin-ports-core'],this.layers.ports);
    this.toggleGroup(['merlin-routes-glow','merlin-routes-line'],this.layers.routes);
    this.toggleGroup(['merlin-city-glow','merlin-city-core'],this.layers.labels);
  }

  syncLabels() {
    if(!this.labelRoot)return;this.labelRoot.innerHTML='';
    if(!this.layers.labels||!this.reference)return;
    const zoom=this.map.zoom||2;
    const labels=[];
    // Country labels stay sparse and useful; cities progressively appear as the user zooms.
    const countries=(this.reference.countries||[]).filter(c=>finite(c.lat,c.lon));
    const worldLabels=new Set(['US','CA','BR','GB','FR','DE','UA','RU','TR','IR','SA','EG','ZA','IN','CN','JP','KR','TW','AU','MX']);
    const regionalLabels=new Set(['US','CA','MX','GB','IE','FR','DE','IT','ES','PL','UA','RO','GR','SE','NO','FI','RU','BY','KZ','GE','AZ','AM','TR','IR','IQ','IL','PS','JO','LB','SY','SA','AE','QA','KW','BH','OM','YE','EG','CN','TW','JP','KR','KP','PH','VN','SG','MY','ID','TH','IN','PK','BD','HK']);
    for(const c of countries){
      const code=String(c.iso2||'').toUpperCase(),population=Number(c.populationBaseline||0),worldKey=worldLabels.has(code),regionalKey=regionalLabels.has(code);
      if(zoom<2.3 && !worldKey && population<70000000)continue;
      if(zoom>=2.3 && zoom<3.1 && !regionalKey && population<30000000)continue;
      if(this.map.isFallback() && zoom>=3.1 && !regionalKey)continue;
      labels.push(label('country',c.lat,c.lon,c.name,(worldKey||regionalKey)?'priority':''));
    }
    if(zoom>=3.1&&!this.map.isFallback()){
      const max=zoom>=5?120:55;
      for(const c of (this.reference.cities||[]).filter(c=>finite(c.lat,c.lon)).slice(0,max))labels.push(label('city',c.lat,c.lon,c.name,''));
    }
    if(zoom>=3.5&&this.layers.nodes)for(const n of(this.reference.strategicNodes||[]))if(finite(n.lat,n.lon))labels.push(label('node',n.lat,n.lon,n.name,''));
    if(zoom>=4.7&&this.layers.ports)for(const p of(this.reference.ports||[]).filter(p=>Number(p.importance||0)>=84)){const lat=Number(p.coordinates?.lat),lon=Number(p.coordinates?.lon);if(finite(lat,lon))labels.push(label('port',lat,lon,p.name,''))}
    for(const item of this.events){
      if(!this.layers.events||Number(item.signalScore||0)<76)continue; const group=overlayGroup(item); if(this.layers[group]===false)continue;
      const lat=Number(item.location?.lat),lon=Number(item.location?.lon); if(finite(lat,lon))labels.push(label('event',lat,lon,(item.location?.name||item.title||'').slice(0,28),group));
    }
    for(const row of labels){const el=document.createElement('span');el.className=`map-html-label ${row.kind} ${row.extra}`;el.textContent=row.text;el.dataset.lat=String(row.lat);el.dataset.lon=String(row.lon);this.labelRoot.append(el)}
    this._positionLabels();
  }

  _positionLabels(){if(!this.labelRoot)return;const r=this.map.viewport.getBoundingClientRect();for(const el of this.labelRoot.children){const p=this.map.project(Number(el.dataset.lat),Number(el.dataset.lon));const visible=p.x>-80&&p.y>-30&&p.x<r.width+80&&p.y<r.height+30;el.style.display=visible?'block':'none';if(visible)el.style.transform=`translate(${Math.round(p.x)}px,${Math.round(p.y)}px)`}}
  _countryPriority(code){const p=(this.reference?.countryPriorityProfiles||[]).find(x=>String(x.iso2||x.countryCode||'').toUpperCase()===String(code).toUpperCase());return Number(p?.priority||p?.coveragePriority||0)}
  _ensureLabelRoot(){let root=this.map.viewport.querySelector('#mapHtmlLabels');if(!root){root=document.createElement('div');root.id='mapHtmlLabels';root.className='map-html-labels';this.map.viewport.append(root)}return root}

  syncFallback() {
    const overlay=this.map.getFallbackOverlay?.(),routeSvg=this.map.getFallbackRoutes?.();if(!overlay||!routeSvg)return;overlay.innerHTML='';routeSvg.innerHTML='';
    const xy=(lat,lon)=>({x:((Number(lon)+180)/360)*100,y:((90-Number(lat))/180)*100});
    if(this.reference&&this.layers.routes)for(const route of this.reference.routes||[]){const coords=route.geometry?.coordinates||[];if(coords.length<2)continue;const pts=coords.map(([lon,lat])=>{const p=xy(lat,lon);return`${p.x*10},${p.y*5}`}).join(' ');const line=document.createElementNS('http://www.w3.org/2000/svg','polyline');line.setAttribute('points',pts);line.setAttribute('class','fallback-route');routeSvg.append(line)}
    const add=(kind,lat,lon,labelText,click,score=0,extra='')=>{if(!finite(lat,lon))return;const p=xy(lat,lon);const b=document.createElement('button');b.className=`fb-marker fb-${kind} ${score>=78?'fb-hot':''} ${extra}`;b.style.left=`${p.x}%`;b.style.top=`${p.y}%`;b.title=labelText||'';b.setAttribute('aria-label',labelText||kind);if(click)b.onclick=click;const core=document.createElement('i');b.append(core);overlay.append(b)};
    const heat=(lat,lon,score,group)=>{if(!finite(lat,lon))return;const p=xy(lat,lon),size=Math.round(34+Math.max(0,Number(score)-60)*1.35);const h=document.createElement('span');h.className=`fb-heat fb-heat-${group}`;h.style.left=`${p.x}%`;h.style.top=`${p.y}%`;h.style.width=`${size}px`;h.style.height=`${size}px`;overlay.append(h)};
    if(this.reference&&this.layers.nodes)for(const n of(this.reference.strategicNodes||[]).slice(0,48))add('node',n.lat,n.lon,n.name,()=>this.map.focus(n.lat,n.lon,4.4));
    if(this.reference&&this.layers.ports)for(const p of(this.reference.ports||[]).filter(x=>Number(x.importance||0)>=82).slice(0,50))add('port',Number(p.coordinates?.lat),Number(p.coordinates?.lon),p.name,()=>this.map.focus(Number(p.coordinates.lat),Number(p.coordinates.lon),5));
    if(this.layers.events)for(const item of this.events){const group=overlayGroup(item);if(this.layers[group]===false)continue;const lat=Number(item.location?.lat),lon=Number(item.location?.lon),score=Number(item.signalScore||0),text=`${item.title||''} ${item.summary||''}`.toLowerCase(),alert=/airspace|aviation|naval|maritime|vessel|tanker|ship|strait|missile|drone/.test(text);if(this.layers.heatmap&&score>=68)heat(lat,lon,score,group);add('event',lat,lon,item.title,()=>this.onSelect(item),score,`fb-${group} ${this.layers.alerts&&alert?'fb-alert':''}`)}
  }

  toggleGroup(ids,visible){const gl=this.map.getMap();if(!gl)return;for(const id of ids){try{if(gl.getLayer(id))gl.setLayoutProperty(id,'visibility',visible?'visible':'none')}catch{}}}
  setSource(id,data){const gl=this.map.getMap();if(!gl||!this.map.isReady())return;try{const source=gl.getSource(id);if(source?.setData)source.setData(data);else gl.addSource(id,{type:'geojson',data,promoteId:'id'})}catch(error){console.error(`Could not update ${id}`,error)}}
  addLayer(layer){const gl=this.map.getMap();if(!gl||!this.map.isReady())return;try{if(!gl.getLayer(layer.id))gl.addLayer(layer)}catch(error){console.error(`Could not add ${layer.id}`,error)}}
}

function overlayGroup(item){
  const c=String(item.category||'').toLowerCase();const t=`${item.title||''} ${item.summary||''}`.toLowerCase();
  if(c==='conflict'||/attack|strike|missile|drone|military|troops|war|ceasefire/.test(t))return'conflict';
  if(c==='sanctions'||/sanction|designation|asset freeze|export ban/.test(t))return'sanctions';
  if(c==='shipping'||/shipping|vessel|tanker|maritime|port|strait|freight/.test(t))return'shipping';
  if(c==='energy'||/oil|gas|lng|pipeline|refinery|power grid|energy/.test(t))return'energy';
  if(c==='cyber'||/cyber|malware|ransomware|vulnerability|ics/.test(t))return'cyber';
  if(c==='policy'||/election|government|cabinet|diplomatic|treaty|policy|regulation/.test(t))return'politics';
  if(['macro','rates','trade','commodities'].includes(c)||/central bank|inflation|rate cut|rate hike|tariff|currency/.test(t))return'market';
  if(c==='semiconductors'||/semiconductor|chip|supply chain|rare earth|export control/.test(t))return'supply';
  return'other';
}
function groupColorExpression(){return['match',['get','overlay'],...Object.entries(GROUP_COLORS).flatMap(([k,v])=>[k,v]),GROUP_COLORS.other]}
function pointFeature(id,lon,lat,properties){return{type:'Feature',id,properties:{id:properties.id??String(id),...properties},geometry:{type:'Point',coordinates:[Number(lon),Number(lat)]}}}
function fc(features){return{type:'FeatureCollection',features}}
function finite(...v){return v.every(x=>Number.isFinite(Number(x)))}
function label(kind,lat,lon,text,extra=''){return{kind,lat:Number(lat),lon:Number(lon),text:String(text),extra}}
