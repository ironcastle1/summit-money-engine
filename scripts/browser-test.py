from pathlib import Path
import subprocess,tempfile,time,json,urllib.request,shutil,websocket,sys,base64,re

root=Path(__file__).resolve().parents[1]
out=root/'browser-output'
shutil.rmtree(out,ignore_errors=True)
out.mkdir()
fixture=out/'fixture.json'
bundle=out/'test-bundle.js'
subprocess.run(['node','scripts/write-browser-fixture.js',str(fixture)],cwd=root,check=True,stdout=subprocess.PIPE,text=True)
subprocess.run(['node','scripts/build-browser-bundle.js',str(bundle)],cwd=root,check=True,stdout=subprocess.PIPE,text=True)
payload=json.loads(fixture.read_text())
snapshot=payload['snapshot']; reference=payload['reference']
css=(root/'public/styles.css').read_text(); html=(root/'public/index.html').read_text()
html=re.sub(r'<link rel="stylesheet" href="/vendor/maplibre-gl.css">\s*','',html)
html=re.sub(r'<link rel="stylesheet" href="/styles.css">',f'<style>{css}</style>',html)
html=re.sub(r'<script type="module" src="/app.js"></script>','',html)

# A deterministic MapLibre-compatible harness. This tests Merlin's integration and native layer lifecycle
# without claiming that the isolated build host can reach third-party vector tiles.
maplibre_stub=r"""
(()=>{
 class StubSource{constructor(spec){this.data=spec.data||null}setData(data){this.data=data}}
 class StubMap{
  constructor(opts){
   this.opts=opts;this.center={lng:opts.center?.[0]||0,lat:opts.center?.[1]||0};this.zoom=opts.zoom||1;
   this.handlers={};this.layerHandlers={};this.sources=new Map();this.layers=new Map();this.style=opts.style;
   this.container=typeof opts.container==='string'?document.getElementById(opts.container):opts.container;
   this.root=document.createElement('div');this.root.className='maplibregl-map';this.root.style.cssText='position:absolute;inset:0;background:radial-gradient(circle at 54% 46%,#193b3b 0%,#112d39 32%,#071827 67%,#04101a 100%);overflow:hidden';
   this.canvas=document.createElement('canvas');this.canvas.className='maplibregl-canvas';this.canvas.style.cssText='position:absolute;inset:0;width:100%;height:100%';this.root.append(this.canvas);this.container.append(this.root);
   this.touchZoomRotate={disableRotation(){}};window.__maplibreInstance=this;
   setTimeout(()=>{this._emit('load',{});this._emit('style.load',{});this._emit('idle',{})},0);
  }
  on(type,a,b){if(typeof a==='string'){const k=type+'|'+a;(this.layerHandlers[k]??=[]).push(b)}else{(this.handlers[type]??=[]).push(a)}return this}
  _emit(type,event){for(const f of this.handlers[type]||[])try{f(event)}catch(e){console.error(e)}}
  fireLayer(type,layer,event){for(const f of this.layerHandlers[type+'|'+layer]||[])try{f(event)}catch(e){console.error(e)}}
  addControl(){return this} getCanvas(){return this.canvas}
  getCenter(){return this.center} getZoom(){return this.zoom}
  easeTo(o){this._camera(o);return this} jumpTo(o){this._camera(o);return this}
  _camera(o){if(o.center)this.center={lng:o.center[0],lat:o.center[1]};if(Number.isFinite(o.zoom))this.zoom=o.zoom;this._emit('move',{});this._emit('moveend',{})}
  project(coord){const r=this.container.getBoundingClientRect(),x=(coord[0]+180)/360*r.width,y=(90-coord[1])/180*r.height;return{x,y}}
  resize(){return this}
  setStyle(style){this.style=style;this.sources.clear();this.layers.clear();setTimeout(()=>{this._emit('style.load',{});this._emit('idle',{})},0);return this}
  getStyle(){return{layers:[{id:'background',type:'background'},{id:'water',type:'fill','source-layer':'water'},{id:'place-city',type:'symbol','source-layer':'place'}]}}
  setPaintProperty(){return this}
  addSource(id,spec){this.sources.set(id,new StubSource(spec));return this} getSource(id){return this.sources.get(id)}
  addLayer(layer){this.layers.set(layer.id,JSON.parse(JSON.stringify(layer)));return this} getLayer(id){return this.layers.get(id)}
  setLayoutProperty(id,key,value){const l=this.layers.get(id);if(l){l.layout=l.layout||{};l.layout[key]=value}return this}
  setFilter(id,value){const l=this.layers.get(id);if(l)l.filter=value;return this}
 }
 class AttributionControl{constructor(o){this.options=o}}
 window.__MERLIN_MAPLIBRE__={Map:StubMap,AttributionControl};
})()
"""

port=9335;tmp=Path(tempfile.mkdtemp(prefix='merlin-browser-'));profile=tmp/'chrome';profile.mkdir()
chrome=subprocess.Popen(['/usr/bin/chromium','--headless=new','--no-sandbox','--disable-gpu',f'--remote-debugging-port={port}','--remote-allow-origins=*',f'--user-data-dir={profile}','--window-size=1680,980','about:blank'],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)

def wait_json(url,timeout=10):
 end=time.time()+timeout
 while time.time()<end:
  try:return json.loads(urllib.request.urlopen(url,timeout=.6).read())
  except Exception:time.sleep(.1)
 raise RuntimeError('timeout '+url)

try:
 page=None;deadline=time.time()+10
 while time.time()<deadline and page is None:
  try:
   tabs=wait_json(f'http://127.0.0.1:{port}/json',1);page=next((x for x in tabs if x.get('type')=='page'),None)
  except Exception:pass
  if page is None:time.sleep(.1)
 if page is None:raise RuntimeError('Chromium started without debuggable page')
 ws=websocket.create_connection(page['webSocketDebuggerUrl'],timeout=8,origin=f'http://127.0.0.1:{port}')
 seq=0;events=[]
 def cmd(method,params=None):
  nonlocal_dummy=None
  global seq
  seq+=1;i=seq;ws.send(json.dumps({'id':i,'method':method,'params':params or {}}))
  while True:
   msg=json.loads(ws.recv())
   if 'method' in msg:events.append(msg)
   if msg.get('id')==i:
    if 'error' in msg:raise RuntimeError(str(msg['error']))
    return msg.get('result',{})
 cmd('Runtime.enable');cmd('Page.enable');cmd('Log.enable')
 frame=cmd('Page.getFrameTree')['frameTree']['frame']['id'];cmd('Page.setDocumentContent',{'frameId':frame,'html':html})
 def ev(expr):
  r=cmd('Runtime.evaluate',{'expression':expr,'returnByValue':True,'awaitPromise':True})
  if 'exceptionDetails' in r:raise RuntimeError(json.dumps(r['exceptionDetails']))
  return r.get('result',{}).get('value')
 ev(maplibre_stub)
 fixture_script=f"""(()=>{{const SNAP={json.dumps(snapshot)};const REF={json.dumps(reference)};const R=window.Response;window.fetch=async function(input,options={{}}){{const raw=typeof input==='string'?input:(input&&input.url)||'';const u=new URL(raw,'https://merlin.test');let body={{}};if(u.pathname==='/api/reference')body=REF;else if(u.pathname==='/api/snapshot'){{const region=u.searchParams.get('region')||'world';const hours=Number(u.searchParams.get('hours')||24);const minScore=Number(u.searchParams.get('minScore')||52);const category=u.searchParams.get('category')||'all';const cutoff=Date.now()-hours*3600000;const signals=(SNAP.signals||[]).filter(s=>s.signalScore>=minScore&&Date.parse(s.publishedAt)>=cutoff&&(region==='world'||s.regionIds.includes(region))&&(category==='all'||s.category===category));body={{...SNAP,signals,filter:{{region,hours,minScore,category}}}};}}else if(u.pathname==='/api/sources')body={{refreshing:false,sources:SNAP.sourceStatuses}};else if(u.pathname==='/api/refresh')body={{ok:true,generatedAt:SNAP.generatedAt}};return new R(JSON.stringify(body),{{status:200,headers:{{'content-type':'application/json'}}}});}};}})()"""
 ev(fixture_script);ev(bundle.read_text())
 end=time.time()+10
 while time.time()<end:
  if ev("document.querySelectorAll('#regionTabs button').length===6 && document.querySelectorAll('.event-card').length>=2 && !!window.__maplibreInstance?.getLayer('merlin-events-core')"):break
  time.sleep(.1)
 checks={}
 checks['plain_brand']=ev("document.querySelector('.brand strong')?.textContent==='MERLIN' && !document.querySelector('.brand-mark') && !document.querySelector('.brand small')")
 checks['vector_map_container']=ev("!!document.querySelector('#glMap .maplibregl-map') && !document.querySelector('.tile-layer') && !document.querySelector('.map-fallback')")
 checks['maplibre_native_events']=ev("!!window.__maplibreInstance.getLayer('merlin-events-core') && window.__maplibreInstance.getSource('merlin-events').data.features.length>=2")
 checks['maplibre_heat_layer']=ev("window.__maplibreInstance.getLayer('merlin-events-heat')?.type==='heatmap'")
 checks['maplibre_routes']=ev("!!window.__maplibreInstance.getLayer('merlin-routes-line') && window.__maplibreInstance.getSource('merlin-routes').data.features.length===15")
 checks['maplibre_ports']=ev("!!window.__maplibreInstance.getLayer('merlin-ports-core') && window.__maplibreInstance.getSource('merlin-ports').data.features.length>=20")
 checks['maplibre_nodes']=ev("!!window.__maplibreInstance.getLayer('merlin-nodes-core') && window.__maplibreInstance.getSource('merlin-nodes').data.features.length>=12")
 checks['city_lights']=ev("!!window.__maplibreInstance.getLayer('merlin-city-glow') && window.__maplibreInstance.getSource('merlin-city-lights').data.features.length>=200")
 checks['tech_grid']=ev("!!window.__maplibreInstance.getLayer('merlin-tech-grid') && !!window.__maplibreInstance.getLayer('merlin-tech-borders')")
 checks['html_labels']=ev("document.querySelectorAll('.map-html-label.country').length>=20")
 checks['no_legacy_markers']=ev("!document.querySelector('.event-marker,.node-marker,.port-marker,.shipping-route,.map-tile')")
 checks['region_tabs']=ev("document.querySelectorAll('#regionTabs button').length===6")
 checks['default_feed']=ev("document.querySelectorAll('.event-card').length>=2")
 checks['map_size']=ev("(()=>{const r=document.querySelector('#mapViewport').getBoundingClientRect();return r.width>900&&r.height>650})()")
 checks['map_available_state']=ev("document.querySelector('#mapUnavailable').classList.contains('hidden')")
 checks['layers_panel']=ev("document.querySelectorAll('.layer-content input[data-layer]').length>=15")
 ev("document.querySelector('input[data-layer=routes]').click();true");time.sleep(.05)
 checks['native_layer_toggle']=ev("window.__maplibreInstance.getLayer('merlin-routes-line').layout.visibility==='none'")
 ev("document.querySelector('input[data-layer=conflict]').click();true");time.sleep(.04)
 checks['category_overlay_toggle']=ev("Array.isArray(window.__maplibreInstance.getLayer('merlin-events-core').filter)")
 ev("document.querySelector('input[data-layer=conflict]').click();true")
 ev("document.querySelector('input[data-layer=routes]').click();true")
 ev("document.querySelector('[data-map=\"satellite\"]').click();true");time.sleep(.1)
 checks['satellite_switch']=ev("document.querySelector('#mapViewport').dataset.basemap==='satellite' && window.__maplibreInstance.style.sources?.satellite?.type==='raster'")
 checks['overlays_readded_after_style']=ev("!!window.__maplibreInstance.getLayer('merlin-events-core') && !!window.__maplibreInstance.getLayer('merlin-routes-line')")
 ev("document.querySelector('[data-map=\"tech\"]').click();true");time.sleep(.1)
 checks['dark_style_switch']=ev("window.__maplibreInstance.style?.sources?.tech?.type==='raster'")
 checks['overlays_after_dark_style']=ev("!!window.__maplibreInstance.getLayer('merlin-events-core')")

 # Fire the native map event to prove event selection is wired through the map layer.
 ev("(()=>{const f=window.__maplibreInstance.getSource('merlin-events').data.features[0];window.__maplibreInstance.fireLayer('click','merlin-events-core',{features:[f]});return true})()")
 time.sleep(.08)
 checks['native_event_click_detail']=ev("document.querySelector('#detailDrawer').classList.contains('open')")
 ev("document.querySelector('[data-action=\"detail-close\"]').click()")

 ev("document.querySelector('#sourceHealth').click();true");time.sleep(.08)
 checks['source_drawer']=ev("document.querySelector('#sourceDrawer').classList.contains('open') && document.querySelectorAll('.source-row').length===106")
 ev("document.querySelector('[data-action=\"sources-close\"]').click()")
 for view,check,expr in [
  ('opportunities','opportunities_workspace',"document.querySelectorAll('.opportunity-card').length>=1"),
  ('markets','markets_workspace',"document.querySelectorAll('.impact-card').length>=1 && document.querySelectorAll('.market-tile').length>=3"),
  ('conflicts','conflicts_workspace',"document.querySelector('.event-table')!==null"),
  ('countries','countries_workspace',"document.querySelectorAll('.country-card').length>=50"),
  ('briefing','briefing_workspace',"document.querySelector('.brief-hero')!==null")]:
  ev(f"document.querySelector('[data-view=\"{view}\"]').click()");time.sleep(.04);checks[check]=ev(expr)
 ev("document.querySelector('[data-view=\"map\"]').click();document.querySelector('[data-action=\"search-toggle\"]').click();let i=document.querySelector('#searchInput');i.value='Taiwan';i.dispatchEvent(new Event('input',{bubbles:true}))");time.sleep(.25)
 checks['search']=ev("document.querySelectorAll('#searchResults button').length>=1")
 ev("document.querySelector('[data-action=\"search-close\"]').click();document.querySelector('[data-region=\"strategic-asia\"]').click()");time.sleep(.25)
 checks['asia_filter']=ev("document.querySelector('[data-region=\"strategic-asia\"]').classList.contains('active') && document.querySelectorAll('.event-card').length>=2")
 checks['no_horizontal_overflow']=ev("document.documentElement.scrollWidth<=document.documentElement.clientWidth+2")
 errors=[e for e in events if e.get('method')=='Runtime.exceptionThrown' or (e.get('method')=='Log.entryAdded' and e.get('params',{}).get('entry',{}).get('level')=='error')]
 checks['no_browser_errors']=len(errors)==0
 shot=cmd('Page.captureScreenshot',{'format':'png','captureBeyondViewport':False}).get('data')
 if shot:(out/'MERLIN_V7_INTEGRATION_DESKTOP.png').write_bytes(base64.b64decode(shot))
 cmd('Emulation.setDeviceMetricsOverride',{'width':390,'height':844,'deviceScaleFactor':1,'mobile':True});ev("window.dispatchEvent(new Event('resize'));true");time.sleep(.25)
 checks['mobile_map']=ev("document.querySelector('#mapViewport').getBoundingClientRect().height>=380")
 checks['mobile_feed']=ev("document.querySelector('#eventFeed').getBoundingClientRect().height>250")
 checks['mobile_no_overflow']=ev("document.documentElement.scrollWidth<=document.documentElement.clientWidth+2")
 report={'checks':checks,'failed':[k for k,v in checks.items() if not v],'browserErrors':errors,'note':'MapLibre API is deterministically stubbed because the isolated Chromium environment cannot access third-party vector tiles.'}
 (out/'MERLIN_V7_BROWSER_REPORT.json').write_text(json.dumps(report,indent=2));print(json.dumps(report,indent=2))
 if report['failed']:sys.exit(1)
finally:
 try:chrome.terminate();chrome.wait(timeout=3)
 except Exception:
  try:chrome.kill()
  except Exception:pass
 shutil.rmtree(tmp,ignore_errors=True)
