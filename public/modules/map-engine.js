const DEG=Math.PI/180;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const mercX=lon=>(Number(lon)+180)/360;
const mercY=lat=>{const p=clamp(Number(lat),-85.05112878,85.05112878)*DEG;return(1-Math.log(Math.tan(p)+1/Math.cos(p))/Math.PI)/2;};
const invLon=x=>x*360-180;
const invLat=y=>Math.atan(Math.sinh(Math.PI*(1-2*y)))/DEG;
const CATEGORY_COLOR={conflict:'#ff5367',maritime:'#20d9ff',sanctions:'#ff9b3d',cyber:'#b47cff',energy:'#ffd35a',markets:'#37e2a3',policy:'#4da8ff',hazard:'#ff6a3c'};
const CATEGORY_LAYER={conflict:'conflict',maritime:'maritime',sanctions:'sanctions',cyber:'cyber',energy:'energy',markets:'markets',policy:'politics',hazard:'signals'};
export class MerlinMap{
  constructor(canvas,{onSelect,onMove}={}){
    this.canvas=canvas;this.ctx=canvas.getContext('2d',{alpha:false});this.onSelect=onSelect||(()=>{});this.onMove=onMove||(()=>{});
    this.centerX=.53;this.centerY=.43;this.zoom=.05;this.minZoom=-.06;this.maxZoom=5.4;this.mode='dark';this.layers={};this.signals=[];this.risk=[];this.assets={};this.ready=false;this.pointer=new Map();this.drag=null;this.dragDistance=0;this.dpr=Math.min(2,window.devicePixelRatio||1);this.frame=0;this.cssW=1;this.cssH=1;
    this.bindEvents();this.resizeObserver=new ResizeObserver(()=>this.resize());this.resizeObserver.observe(canvas.parentElement);
  }
  async load({reference,lines,polygons,imageUrl}){
    this.reference=reference;this.assets.lines=preLines(lines);this.assets.polygons=prePolygons(polygons);this.assets.image=await loadImage(imageUrl);this.assets.routes=(reference.routes?.features||[]).map(f=>({feature:f,points:(f.geometry?.coordinates||[]).map(([lon,lat])=>[mercX(lon),mercY(lat)])}));this.assets.ports=reference.ports||[];this.assets.cities=reference.cities||[];this.assets.nodes=reference.strategicNodes||[];this.assets.countries=reference.countries||[];this.countryByName=new Map(this.assets.countries.map(c=>[c.name.toLowerCase(),c]));this.countryByIso3=new Map(this.assets.countries.map(c=>[c.iso3,c]));this.ready=true;this.resize();this.schedule();return this;
  }
  setLayers(v){this.layers={...this.layers,...v};this.schedule();}
  setSignals(v){this.signals=v||[];this.schedule();}
  setRisk(v){this.risk=v||[];this.schedule();}
  setMode(v){this.mode=v;this.schedule();}
  setRegion(region){if(!region||region.id==='world'){this.centerX=.52;this.centerY=.45;this.zoom=.08;}else{this.centerX=mercX(region.center[1]);this.centerY=mercY(region.center[0]);this.zoom=clamp((region.zoom||2.3)-1.20,.9,2.4);}this.clampCenter();this.schedule();this.emitMove();}
  fitWorld(){this.centerX=.5;this.centerY=.47;this.zoom=0;this.schedule();this.emitMove();}
  focus(lon,lat,zoom=2.7){this.centerX=mercX(lon);this.centerY=mercY(lat);this.zoom=clamp(zoom,this.minZoom,this.maxZoom);this.clampCenter();this.schedule();this.emitMove();}
  zoomBy(delta,px=this.cssW/2,py=this.cssH/2){const before=this.screenToWorld(px,py),next=clamp(this.zoom+delta,this.minZoom,this.maxZoom);if(next===this.zoom)return;this.zoom=next;const s=this.scale();this.centerX=before.x-(px-this.cssW/2)/s;this.centerY=before.y-(py-this.cssH/2)/s;this.clampCenter();this.schedule();this.emitMove();}
  panBy(dx,dy){const s=this.scale();this.centerX-=dx/s;this.centerY-=dy/s;this.clampCenter();this.schedule();this.emitMove();}
  viewState(){return{zoom:this.zoom,scale:2**this.zoom,center:[invLon((this.centerX%1+1)%1),invLat(this.centerY)]};}
  resize(){const r=this.canvas.getBoundingClientRect();this.cssW=Math.max(1,r.width);this.cssH=Math.max(1,r.height);this.dpr=Math.min(2,window.devicePixelRatio||1);const w=Math.round(this.cssW*this.dpr),h=Math.round(this.cssH*this.dpr);if(this.canvas.width!==w||this.canvas.height!==h){this.canvas.width=w;this.canvas.height=h;}this.schedule();}
  scale(){return this.cssW*Math.pow(2,this.zoom);}
  worldToScreen(x,y){const s=this.scale();let dx=x-this.centerX;while(dx>.5)dx-=1;while(dx<-.5)dx+=1;return{x:this.cssW/2+dx*s,y:this.cssH/2+(y-this.centerY)*s};}
  lonLatToScreen(lon,lat){return this.worldToScreen(mercX(lon),mercY(lat));}
  screenToWorld(x,y){const s=this.scale();return{x:this.centerX+(x-this.cssW/2)/s,y:this.centerY+(y-this.cssH/2)/s};}
  screenToLonLat(x,y){const p=this.screenToWorld(x,y);return{lon:invLon((p.x%1+1)%1),lat:invLat(p.y)};}
  bindEvents(){
    this.canvas.addEventListener('wheel',e=>{e.preventDefault();const r=this.canvas.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top;const unit=e.deltaMode===1?16:e.deltaMode===2?this.cssH:1;const d=-e.deltaY*unit*(e.ctrlKey?.0055:.00145);this.zoomBy(clamp(d,-.8,.8),x,y);},{passive:false});
    this.canvas.addEventListener('dblclick',e=>{e.preventDefault();const r=this.canvas.getBoundingClientRect();this.zoomBy(.72,e.clientX-r.left,e.clientY-r.top);});
    this.canvas.addEventListener('pointerdown',e=>{this.canvas.setPointerCapture?.(e.pointerId);this.pointer.set(e.pointerId,{x:e.clientX,y:e.clientY});this.dragDistance=0;if(this.pointer.size===1)this.drag={x:e.clientX,y:e.clientY};else if(this.pointer.size===2)this.pinchState=this.pinchMeasure();});
    this.canvas.addEventListener('pointermove',e=>{if(!this.pointer.has(e.pointerId))return;const prev=this.pointer.get(e.pointerId);this.pointer.set(e.pointerId,{x:e.clientX,y:e.clientY});if(this.pointer.size===1&&this.drag){const dx=e.clientX-this.drag.x,dy=e.clientY-this.drag.y;this.drag={x:e.clientX,y:e.clientY};this.dragDistance+=Math.hypot(dx,dy);this.panBy(dx,dy);}else if(this.pointer.size===2){const now=this.pinchMeasure();if(this.pinchState&&now.dist>0&&this.pinchState.dist>0){const delta=Math.log2(now.dist/this.pinchState.dist);const r=this.canvas.getBoundingClientRect();this.zoomBy(delta,now.cx-r.left,now.cy-r.top);}this.pinchState=now;}else if(prev){this.dragDistance+=Math.hypot(e.clientX-prev.x,e.clientY-prev.y);}});
    const up=e=>{const wasClick=this.pointer.size===1&&this.dragDistance<6;this.pointer.delete(e.pointerId);if(!this.pointer.size){this.drag=null;this.pinchState=null;if(wasClick){const r=this.canvas.getBoundingClientRect();this.selectAt(e.clientX-r.left,e.clientY-r.top);}}else if(this.pointer.size===1){const p=[...this.pointer.values()][0];this.drag={x:p.x,y:p.y};}};
    this.canvas.addEventListener('pointerup',up);this.canvas.addEventListener('pointercancel',up);this.canvas.addEventListener('contextmenu',e=>e.preventDefault());
  }
  pinchMeasure(){const p=[...this.pointer.values()];if(p.length<2)return null;return{dist:Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y),cx:(p[0].x+p[1].x)/2,cy:(p[0].y+p[1].y)/2};}
  clampCenter(){this.centerY=clamp(this.centerY,-.18,1.18);this.centerX=(this.centerX%1+1)%1;}
  emitMove(){this.onMove(this.viewState());}
  schedule(){if(!this.ready||this.frame)return;this.frame=requestAnimationFrame(()=>{this.frame=0;this.render();});}
  render(){if(!this.ready||!this.cssW)return;const c=this.ctx,w=this.cssW,h=this.cssH;c.setTransform(this.dpr,0,0,this.dpr,0,0);c.clearRect(0,0,w,h);c.fillStyle='#020a12';c.fillRect(0,0,w,h);this.drawBase(c,w,h);if(this.layers.countryRisk)this.drawCountryRisk(c);if(this.layers.heat)this.drawHeat(c);if(this.layers.routes)this.drawRoutes(c);if(this.layers.countryBorders)this.drawBorders(c);if(this.layers.supply)this.drawSupply(c);if(this.layers.air)this.drawAirAlerts(c);if(this.layers.strategicNodes)this.drawNodes(c);if(this.layers.ports)this.drawPorts(c);if(this.layers.cities)this.drawCities(c);this.drawEventOverlays(c);if(this.layers.signals)this.drawSignals(c);this.drawReticle(c);}
  drawBase(c,w,h){const img=this.assets.image,s=this.scale(),left=this.centerX-w/(2*s),top=this.centerY-h/(2*s),sw=w/s,sh=h/s;for(let k=-2;k<=2;k++){const wl=left-k,wr=wl+sw;if(wr<=0||wl>=1)continue;const a=clamp(wl,0,1),b=clamp(wr,0,1),ta=clamp(top,0,1),tb=clamp(top+sh,0,1);if(b<=a||tb<=ta)continue;c.drawImage(img,a*img.width,ta*img.height,(b-a)*img.width,(tb-ta)*img.height,(a+k-left)*s,(ta-top)*s,(b-a)*s,(tb-ta)*s);}if(this.mode==='dark'){const g=c.createLinearGradient(0,0,0,h);g.addColorStop(0,'rgba(0,13,26,.04)');g.addColorStop(.65,'rgba(0,17,40,.10)');g.addColorStop(1,'rgba(0,6,18,.32)');c.fillStyle=g;c.fillRect(0,0,w,h);}this.drawGrid(c);}
  drawGrid(c){const step=this.zoom<1?30:this.zoom<2.6?15:5;c.save();c.strokeStyle='rgba(53,181,225,.105)';c.lineWidth=.65;c.setLineDash([2,6]);for(let lon=-180;lon<=180;lon+=step){const a=this.lonLatToScreen(lon,-80),b=this.lonLatToScreen(lon,80);c.beginPath();c.moveTo(a.x,a.y);c.lineTo(b.x,b.y);c.stroke();}for(let lat=-75;lat<=75;lat+=step){c.beginPath();let first=true;for(let lon=-180;lon<=180;lon+=5){const p=this.lonLatToScreen(lon,lat);if(first){c.moveTo(p.x,p.y);first=false;}else c.lineTo(p.x,p.y);}c.stroke();}c.restore();}
  drawCountryRisk(c){const by=new Map(this.risk.map(r=>[r.iso3,r]));for(const p of this.assets.polygons){const country=this.countryForPolygon(p),r=country?this.risk.find(x=>x.iso2===country.iso2):by.get(p.iso3);if(!r)continue;const alpha=.025+Math.min(.18,(r.score||0)/500);c.fillStyle=r.score>=72?`rgba(255,68,84,${alpha})`:r.score>=50?`rgba(242,184,63,${alpha})`:`rgba(34,168,223,${alpha})`;for(const poly of p.projected)this.fillPolygon(c,poly);}}
  drawHeat(c){for(const s of this.signals){if(!this.signalVisible(s))continue;const p=this.lonLatToScreen(s.lon,s.lat);if(!onscreen(p,this.cssW,this.cssH,90))continue;const radius=24+Math.min(50,s.signalScore*.45);const rgb=hexToRgb(CATEGORY_COLOR[s.category]||'#4aa9ff'),g=c.createRadialGradient(p.x,p.y,0,p.x,p.y,radius);g.addColorStop(0,`rgba(${rgb},.23)`);g.addColorStop(.42,`rgba(${rgb},.10)`);g.addColorStop(1,`rgba(${rgb},0)`);c.fillStyle=g;c.fillRect(p.x-radius,p.y-radius,radius*2,radius*2);}}
  drawBorders(c){c.save();for(const f of this.assets.lines){const coast=f.kind==='coast';c.beginPath();for(const line of f.parts){let started=false,prev=null;for(let i=0;i<line.length;i+=2){const p=this.worldToScreen(line[i],line[i+1]);if(prev&&Math.abs(p.x-prev.x)>this.cssW*.7){started=false;}if(!started){c.moveTo(p.x,p.y);started=true;}else c.lineTo(p.x,p.y);prev=p;}}if(coast){c.strokeStyle='rgba(48,207,246,.58)';c.lineWidth=this.zoom>2?1.15:.78;c.shadowColor='rgba(0,201,255,.48)';c.shadowBlur=3;}else{c.strokeStyle='rgba(105,200,232,.52)';c.lineWidth=this.zoom>2?1.05:.72;c.shadowBlur=0;}c.stroke();}c.shadowBlur=0;c.restore();}
  drawRoutes(c){c.save();c.setLineDash([8,7]);c.lineWidth=this.zoom>2?1.35:1.05;c.strokeStyle='rgba(22,199,247,.68)';c.shadowColor='rgba(0,185,255,.5)';c.shadowBlur=5;for(const r of this.assets.routes){c.beginPath();let prev=null;for(const [x,y] of r.points){const p=this.worldToScreen(x,y);if(!prev||Math.abs(p.x-prev.x)>this.cssW*.7)c.moveTo(p.x,p.y);else c.lineTo(p.x,p.y);prev=p;}c.stroke();}c.restore();}
  drawSupply(c){for(const n of this.assets.nodes){const text=`${n.type||''} ${(n.exposures||[]).join(' ')}`.toLowerCase();if(!/(semiconductor|chip|shipping|container|supply|lng|oil|rare earth|pipeline|chokepoint|port)/.test(text))continue;const p=this.lonLatToScreen(n.lon,n.lat);if(!onscreen(p,this.cssW,this.cssH,20))continue;c.save();c.translate(p.x,p.y);c.rotate(Math.PI/4);c.strokeStyle='rgba(83,171,255,.92)';c.fillStyle='rgba(30,112,185,.18)';c.lineWidth=1;c.fillRect(-5,-5,10,10);c.strokeRect(-5,-5,10,10);c.restore();}}
  drawAirAlerts(c){for(const s of this.signals){if(!this.signalVisible(s))continue;const alert=(s.publicIndicators||[]).some(i=>['aviation','defense','maritime'].includes(i.lane));if(!alert)continue;const p=this.lonLatToScreen(s.lon,s.lat);if(!onscreen(p,this.cssW,this.cssH,45))continue;c.save();c.strokeStyle='rgba(91,214,255,.65)';c.lineWidth=1;c.setLineDash([3,4]);for(const r of [14,23]){c.beginPath();c.arc(p.x,p.y,r,0,Math.PI*2);c.stroke();}c.restore();}}
  drawNodes(c){for(const n of this.assets.nodes){const p=this.lonLatToScreen(n.lon,n.lat);if(!onscreen(p,this.cssW,this.cssH,24))continue;c.save();c.translate(p.x,p.y);c.fillStyle='rgba(242,184,63,.15)';c.beginPath();c.arc(0,0,10,0,Math.PI*2);c.fill();c.strokeStyle='#f2b83f';c.lineWidth=1.4;c.beginPath();c.arc(0,0,4.2,0,Math.PI*2);c.stroke();c.fillStyle='#f2b83f';c.beginPath();c.arc(0,0,1.7,0,Math.PI*2);c.fill();if(this.layers.labels&&this.zoom>1.5)label(c,n.name,8,7,'#f9d66e');c.restore();}}
  drawPorts(c){for(const p0 of this.assets.ports){const p=this.lonLatToScreen(p0.coordinates.lon,p0.coordinates.lat);if(!onscreen(p,this.cssW,this.cssH,16))continue;c.save();c.translate(p.x,p.y);c.strokeStyle='#27d5ff';c.fillStyle='#042c3b';c.lineWidth=1.2;c.fillRect(-3.2,-3.2,6.4,6.4);c.strokeRect(-3.2,-3.2,6.4,6.4);if(this.layers.labels&&this.zoom>2.15&&p0.importance>=94)label(c,p0.name,7,7,'#86ddf3');c.restore();}}
  drawCities(c){if(this.zoom<1.15)return;const min=this.zoom<1.8?0:this.zoom<2.6?0:0;let shown=0;for(const city of this.assets.cities){const p=this.lonLatToScreen(city.lon,city.lat);if(!onscreen(p,this.cssW,this.cssH,15))continue;const important=city.kind==='capital';if(this.zoom<1.9&&!important)continue;c.fillStyle='rgba(144,228,250,.82)';c.beginPath();c.arc(p.x,p.y,important?2.1:1.25,0,Math.PI*2);c.fill();if(this.layers.labels&&important&&(this.zoom>1.35||shown<20)){label(c,city.name,p.x+5,p.y-4,'#d8f5ff',false);shown++;}}}

  drawEventOverlays(c){
    const keys=['conflict','politics','sanctions','maritime','energy','cyber','markets'];
    for(const s of this.signals){
      const p=this.lonLatToScreen(s.lon,s.lat);if(!onscreen(p,this.cssW,this.cssH,34))continue;
      const matches=this.overlayMatches(s);
      for(const key of keys){if(this.layers[key]===false||!matches.has(key))continue;this.drawOverlayGlyph(c,p,key,s);}
    }
  }
  overlayMatches(s){
    const set=new Set(),cat=CATEGORY_LAYER[s.category];if(cat&&cat!=='signals')set.add(cat);
    const lanes=(s.publicIndicators||[]).map(i=>String(i.lane||'').toLowerCase());
    if(lanes.some(x=>x==='defense'||x==='conflict'||x==='military'))set.add('conflict');
    if(lanes.includes('policy'))set.add('politics');if(lanes.includes('maritime'))set.add('maritime');if(lanes.includes('energy'))set.add('energy');if(lanes.includes('cyber'))set.add('cyber');if(lanes.includes('markets'))set.add('markets');
    const text=`${s.title||''} ${s.summary||''}`.toLowerCase(),tx=(s.marketTransmission||[]).map(x=>`${x.name||''} ${(x.matched||[]).join(' ')}`).join(' ').toLowerCase();
    if(/sanction|export control|asset freeze|embargo|blacklist/.test(text+' '+tx))set.add('sanctions');
    if(/refinery|pipeline|oil |gas |lng|energy|power grid|crude|fuel/.test(text))set.add('energy');
    if(/shipping|vessel|tanker|port |strait|hormuz|red sea|freight|container|canal/.test(text))set.add('maritime');
    if((s.marketTransmission||[]).length||/stocks|market|yield|inflation|interest rate|currency|dollar|yen|bitcoin/.test(text))set.add('markets');
    return set;
  }
  drawOverlayGlyph(c,p,key,s){
    const col={conflict:'#ff5367',politics:'#4da8ff',sanctions:'#ff9b3d',maritime:'#20d9ff',energy:'#ffd35a',cyber:'#b47cff',markets:'#37e2a3'}[key];
    const r=s.priority==='HIGH'?11:9;c.save();c.translate(p.x,p.y);c.strokeStyle=col;c.fillStyle=col;c.lineWidth=1.25;c.shadowColor=col;c.shadowBlur=5;
    if(key==='conflict'){c.setLineDash([3,3]);c.beginPath();c.arc(0,0,r+6,0,Math.PI*2);c.stroke();c.setLineDash([]);c.beginPath();c.moveTo(-r-10,0);c.lineTo(-r-4,0);c.moveTo(r+4,0);c.lineTo(r+10,0);c.stroke();}
    else if(key==='politics'){c.rotate(Math.PI/4);c.strokeRect(-r-4,-r-4,(r+4)*2,(r+4)*2);}
    else if(key==='sanctions'){c.setLineDash([5,3]);c.beginPath();c.arc(0,0,r+9,-.2,Math.PI*1.35);c.stroke();c.setLineDash([]);}
    else if(key==='maritime'){c.beginPath();c.arc(0,0,r+12,Math.PI*.1,Math.PI*.9);c.stroke();c.beginPath();c.arc(0,0,r+12,Math.PI*1.1,Math.PI*1.9);c.stroke();}
    else if(key==='energy'){for(let a=0;a<Math.PI*2;a+=Math.PI/2){c.beginPath();c.moveTo(Math.cos(a)*(r+6),Math.sin(a)*(r+6));c.lineTo(Math.cos(a)*(r+11),Math.sin(a)*(r+11));c.stroke();}}
    else if(key==='cyber'){c.setLineDash([2,2]);c.beginPath();for(let i=0;i<6;i++){const a=-Math.PI/2+i*Math.PI/3,x=Math.cos(a)*(r+8),y=Math.sin(a)*(r+8);i?c.lineTo(x,y):c.moveTo(x,y);}c.closePath();c.stroke();c.setLineDash([]);}
    else if(key==='markets'){c.globalAlpha=.72;c.beginPath();c.arc(0,0,r+15,0,Math.PI*2);c.stroke();}
    c.restore();
  }

  drawSignals(c){for(const s of this.signals){if(!this.signalVisible(s))continue;const p=this.lonLatToScreen(s.lon,s.lat);if(!onscreen(p,this.cssW,this.cssH,28))continue;const col=CATEGORY_COLOR[s.category]||'#4aa9ff',r=s.priority==='HIGH'?6.6:5.2;c.save();c.shadowColor=col;c.shadowBlur=s.priority==='HIGH'?14:9;c.fillStyle=col;c.beginPath();c.arc(p.x,p.y,r,0,Math.PI*2);c.fill();c.shadowBlur=0;c.strokeStyle='rgba(240,252,255,.95)';c.lineWidth=1.4;c.stroke();if(s.fallback){c.strokeStyle='#f2b83f';c.lineWidth=1.2;c.setLineDash([2,2]);c.beginPath();c.arc(p.x,p.y,r+4.5,0,Math.PI*2);c.stroke();}if(this.layers.labels&&this.zoom>2.45)label(c,trim(s.title,34),p.x+9,p.y-7,'#effcff',false);c.restore();}}
  drawReticle(c){c.save();const x=this.cssW/2,y=this.cssH/2;c.strokeStyle='rgba(82,197,232,.13)';c.lineWidth=.7;c.beginPath();c.moveTo(x-15,y);c.lineTo(x-5,y);c.moveTo(x+5,y);c.lineTo(x+15,y);c.moveTo(x,y-15);c.lineTo(x,y-5);c.moveTo(x,y+5);c.lineTo(x,y+15);c.stroke();c.restore();}
  signalVisible(s){return this.layers.signals!==false;}
  selectAt(x,y){let hit=null,best=Infinity;for(const s of this.signals){if(!this.signalVisible(s))continue;const p=this.lonLatToScreen(s.lon,s.lat),d=Math.hypot(p.x-x,p.y-y);if(d<14&&d<best){best=d;hit={type:'signal',data:s};}}if(!hit&&this.layers.ports){for(const d of this.assets.ports){const p=this.lonLatToScreen(d.coordinates.lon,d.coordinates.lat),dd=Math.hypot(p.x-x,p.y-y);if(dd<10&&dd<best){best=dd;hit={type:'port',data:d};}}}if(!hit&&this.layers.strategicNodes){for(const d of this.assets.nodes){const p=this.lonLatToScreen(d.lon,d.lat),dd=Math.hypot(p.x-x,p.y-y);if(dd<12&&dd<best){best=dd;hit={type:'node',data:d};}}}if(!hit){const ll=this.screenToLonLat(x,y),poly=this.findCountry(ll.lon,ll.lat);if(poly)hit={type:'country',data:poly};}if(hit)this.onSelect(hit);}
  findCountry(lon,lat){const x=mercX(lon),y=mercY(lat);for(const p of this.assets.polygons){for(const poly of p.projected){if(pointInPolygon(x,y,poly))return p;}}return null;}
  countryForPolygon(p){return this.countryByIso3.get(p.iso3)||this.countryByName.get(String(p.name||'').toLowerCase());}
  fillPolygon(c,poly){c.beginPath();for(const ring of poly){let first=true,prev=null;for(let i=0;i<ring.length;i+=2){const p=this.worldToScreen(ring[i],ring[i+1]);if(prev&&Math.abs(p.x-prev.x)>this.cssW*.7){first=true;}if(first){c.moveTo(p.x,p.y);first=false;}else c.lineTo(p.x,p.y);prev=p;}c.closePath();}c.fill('evenodd');}
}
function preLines(fc){return(fc.features||[]).map(f=>{const geom=f.geometry||{},coords=geom.type==='MultiLineString'?geom.coordinates:[geom.coordinates||[]];return{kind:f.properties?.kind||'border',parts:coords.map(line=>{const a=new Float32Array(line.length*2);line.forEach(([lon,lat],i)=>{a[i*2]=mercX(lon);a[i*2+1]=mercY(lat);});return a;})};});}
function prePolygons(fc){return(fc.features||[]).map(f=>{const geom=f.geometry||{},sets=geom.type==='MultiPolygon'?geom.coordinates:[geom.coordinates||[]];return{name:f.properties?.name||'',iso3:f.properties?.iso3||'',projected:sets.map(poly=>poly.map(ring=>{const a=new Float32Array(ring.length*2);ring.forEach(([lon,lat],i)=>{a[i*2]=mercX(lon);a[i*2+1]=mercY(lat);});return a;}))};});}
function pointInPolygon(x,y,poly){let inside=false;for(let ri=0;ri<poly.length;ri++){const ring=poly[ri];let hit=false;for(let i=0,j=ring.length-2;i<ring.length;j=i,i+=2){const xi=ring[i],yi=ring[i+1],xj=ring[j],yj=ring[j+1];const cross=((yi>y)!==(yj>y))&&(x<(xj-xi)*(y-yi)/(yj-yi||1e-12)+xi);if(cross)hit=!hit;}if(ri===0)inside=hit;else if(hit)inside=false;}return inside;}
function loadImage(src){return new Promise((resolve,reject)=>{const im=new Image();im.decoding='async';im.onload=()=>resolve(im);im.onerror=()=>reject(new Error(`map image failed: ${src}`));im.src=src;});}
function onscreen(p,w,h,m=0){return p.x>-m&&p.x<w+m&&p.y>-m&&p.y<h+m;}
function hexToRgb(hex){const n=parseInt(hex.slice(1),16);return`${n>>16&255},${n>>8&255},${n&255}`;}
function label(c,text,x,y,color='#fff',translate=true){c.save();if(translate){x=x;y=y;}c.font='600 10px Inter,Segoe UI,sans-serif';c.textBaseline='middle';c.lineWidth=3;c.strokeStyle='rgba(0,9,18,.92)';c.strokeText(text,x,y);c.fillStyle=color;c.fillText(text,x,y);c.restore();}
function trim(s,n){s=String(s||'');return s.length>n?s.slice(0,n-1)+'…':s;}
