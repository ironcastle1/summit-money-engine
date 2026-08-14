from pathlib import Path
import subprocess,tempfile,time,json,urllib.request,shutil,websocket,sys,base64,re
root=Path(__file__).resolve().parents[1]; out=root/'browser-output'; shots=root/'screenshots'; shutil.rmtree(out,ignore_errors=True); out.mkdir(); shots.mkdir(exist_ok=True)
fixture=out/'fixture.json'; bundle=out/'bundle.js'
subprocess.run(['node','scripts/write-browser-fixture.js',str(fixture)],cwd=root,check=True,stdout=subprocess.PIPE,text=True)
subprocess.run(['node','scripts/build-browser-bundle.js',str(bundle)],cwd=root,check=True,stdout=subprocess.PIPE,text=True)
payload=json.loads(fixture.read_text()); snap=payload['snapshot']; ref=payload['reference']; countries=payload['countries']
lines=json.loads((root/'public/data/tech-base-lines.json').read_text()); polys=json.loads((root/'public/data/country-polygons.geojson').read_text())
css=(root/'public/styles.css').read_text(); html=(root/'public/index.html').read_text(); html=re.sub(r'<link rel="stylesheet" href="/styles.css">',f'<style>{css}</style>',html); html=re.sub(r'<script type="module" src="/app.js"></script>','',html)
img='data:image/jpeg;base64,'+base64.b64encode((root/'public/assets/world-tech-mercator.jpg').read_bytes()).decode()
js=bundle.read_text().replace("imageUrl:'/assets/world-tech-mercator.jpg'", "imageUrl:"+json.dumps(img))
port=9488; tmp=Path(tempfile.mkdtemp(prefix='merlin-v8-browser-')); profile=tmp/'chrome'; profile.mkdir()
chrome=subprocess.Popen(['/usr/bin/chromium','--headless=new','--no-sandbox','--disable-gpu',f'--remote-debugging-port={port}','--remote-allow-origins=*',f'--user-data-dir={profile}','--window-size=1680,900','about:blank'],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
def getj(url): return json.loads(urllib.request.urlopen(url,timeout=1).read())
try:
 page=None
 for _ in range(100):
  try: page=next((x for x in getj(f'http://127.0.0.1:{port}/json') if x.get('type')=='page'),None)
  except: pass
  if page: break
  time.sleep(.1)
 if not page: raise RuntimeError('no chromium page')
 ws=websocket.create_connection(page['webSocketDebuggerUrl'],timeout=15,origin=f'http://127.0.0.1:{port}'); seq=0; events=[]
 def cmd(method,params=None):
  nonlocal_dummy=None
  global seq
  seq+=1; i=seq; ws.send(json.dumps({'id':i,'method':method,'params':params or {}}))
  while True:
   m=json.loads(ws.recv())
   if 'method' in m: events.append(m)
   if m.get('id')==i:
    if 'error' in m: raise RuntimeError(m['error'])
    return m.get('result',{})
 def ev(expr):
  r=cmd('Runtime.evaluate',{'expression':expr,'returnByValue':True,'awaitPromise':True})
  if 'exceptionDetails' in r: raise RuntimeError(json.dumps(r['exceptionDetails']))
  return r.get('result',{}).get('value')
 def shot(name):
  data=cmd('Page.captureScreenshot',{'format':'png','captureBeyondViewport':False}).get('data'); (root/'screenshots'/name).write_bytes(base64.b64decode(data))
 def click(x,y):
  cmd('Input.dispatchMouseEvent',{'type':'mousePressed','x':x,'y':y,'button':'left','clickCount':1});cmd('Input.dispatchMouseEvent',{'type':'mouseReleased','x':x,'y':y,'button':'left','clickCount':1})
 def drag(x1,y1,x2,y2):
  cmd('Input.dispatchMouseEvent',{'type':'mousePressed','x':x1,'y':y1,'button':'left','clickCount':1});
  for i in range(1,7): cmd('Input.dispatchMouseEvent',{'type':'mouseMoved','x':x1+(x2-x1)*i/6,'y':y1+(y2-y1)*i/6,'button':'left','buttons':1})
  cmd('Input.dispatchMouseEvent',{'type':'mouseReleased','x':x2,'y':y2,'button':'left','clickCount':1})
 cmd('Runtime.enable');cmd('Page.enable');cmd('Log.enable')
 frame=cmd('Page.getFrameTree')['frameTree']['frame']['id'];cmd('Page.setDocumentContent',{'frameId':frame,'html':html})
 shim=f"""(()=>{{const SNAP={json.dumps(snap,separators=(',',':'))};const REF={json.dumps(ref,separators=(',',':'))};const COUNTRIES={json.dumps(countries,separators=(',',':'))};const LINES={json.dumps(lines,separators=(',',':'))};const POLYS={json.dumps(polys,separators=(',',':'))};window.fetch=async(input,opts={{}})=>{{const raw=typeof input==='string'?input:(input&&input.url)||'';const u=new URL(raw,'https://merlin.test');let body={{}};if(u.pathname==='/api/reference')body=REF;else if(u.pathname==='/api/snapshot')body=SNAP;else if(u.pathname==='/api/sources')body={{refreshing:false,coverage:SNAP.sourceCoverage,sources:SNAP.sourceStatuses}};else if(u.pathname==='/api/refresh')body={{ok:true,generatedAt:SNAP.generatedAt,dataMode:SNAP.dataMode}};else if(u.pathname==='/data/tech-base-lines.json')body=LINES;else if(u.pathname==='/data/country-polygons.geojson')body=POLYS;else if(u.pathname.startsWith('/api/country/'))body=COUNTRIES[decodeURIComponent(u.pathname.split('/').pop()).toUpperCase()]||{{}};else return new Response('not found',{{status:404}});return new Response(JSON.stringify(body),{{status:200,headers:{{'content-type':'application/json'}}}});}};}})()"""
 ev(shim); ev(js)
 for _ in range(160):
  ready=ev("document.querySelectorAll('.signal-card').length>=8 && document.querySelectorAll('.ticker-item').length>=6 && document.querySelector('#mapCanvas')?.width>500")
  if ready: break
  time.sleep(.1)
 time.sleep(.5)
 checks={}
 checks['signals_populated']=ev("document.querySelectorAll('.signal-card').length>=8")
 checks['market_ticker_populated']=ev("document.querySelectorAll('.ticker-item').length>=6")
 checks['build_snapshot_disclosed']=ev("document.querySelector('#modeNotice').textContent.includes('BUILD SNAPSHOT')")
 checks['layer_controls']=ev("document.querySelectorAll('[data-layer]').length>=18")
 checks['canvas_large']=ev("(()=>{const r=document.querySelector('#mapCanvas').getBoundingClientRect();return r.width>900&&r.height>560})()")
 # Actual wheel/touchpad-style zoom.
 before=ev("document.querySelector('#zoomReadout').textContent")
 ev("(()=>{const c=document.querySelector('#mapCanvas'),r=c.getBoundingClientRect();c.dispatchEvent(new WheelEvent('wheel',{deltaY:-280,clientX:r.left+r.width*.62,clientY:r.top+r.height*.45,bubbles:true,cancelable:true}));return true})()")
 time.sleep(.18); after=ev("document.querySelector('#zoomReadout').textContent"); checks['wheel_zoom_changes_view']=before!=after
 # Actual drag pan with input events; app exposes the numeric centre only for acceptance diagnostics.
 center_before=ev("document.querySelector('#mapCanvas').dataset.center||''"); drag(800,430,910,485); time.sleep(.18); center_after=ev("document.querySelector('#mapCanvas').dataset.center||''"); checks['drag_pan_changes_center']=bool(center_before and center_after and center_before!=center_after)
 # Reset world for screenshot.
 ev("document.querySelector('#fitWorldButton').click();true");time.sleep(.18)
 # Canvas checksum sampled from real rendered pixels.
 checksum="(()=>{const c=document.querySelector('#mapCanvas'),d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let h=0;for(let i=0;i<d.length;i+=1607)h=(h*131+d[i]+d[i+1]*3+d[i+2]*7)>>>0;return h})()"
 b1=ev(checksum);ev("document.querySelector('[data-layer=countryBorders]').click();true");time.sleep(.18);b2=ev(checksum);checks['country_border_overlay_changes_pixels']=b1!=b2;ev("document.querySelector('[data-layer=countryBorders]').click();true");time.sleep(.12)
 r1=ev(checksum);ev("document.querySelector('[data-layer=routes]').click();true");time.sleep(.18);r2=ev(checksum);checks['shipping_route_overlay_changes_pixels']=r1!=r2;ev("document.querySelector('[data-layer=routes]').click();true");time.sleep(.12)
 s1=ev(checksum);ev("document.querySelector('[data-layer=signals]').click();true");time.sleep(.18);s2=ev(checksum);checks['signal_overlay_changes_pixels']=s1!=s2;ev("document.querySelector('[data-layer=signals]').click();true");time.sleep(.12)
 for layer in ['conflict','politics','sanctions','maritime','energy','cyber','markets','supply','air','heat','countryRisk','strategicNodes','ports']:
  a=ev(checksum);ev(f"document.querySelector('[data-layer={layer}]').click();true");time.sleep(.12);b=ev(checksum);checks[f'{layer}_overlay_changes_pixels']=a!=b;ev(f"document.querySelector('[data-layer={layer}]').click();true");time.sleep(.08)
 # Cities and labels are intentionally suppressed at global zoom; verify them at detailed zoom where they render.
 for _ in range(4): ev("document.querySelector('#zoomIn').click();true");time.sleep(.06)
 for layer in ['cities','labels']:
  a=ev(checksum);ev(f"document.querySelector('[data-layer={layer}]').click();true");time.sleep(.12);b=ev(checksum);checks[f'{layer}_overlay_changes_pixels']=a!=b;ev(f"document.querySelector('[data-layer={layer}]').click();true");time.sleep(.08)
 ev("document.querySelector('#fitWorldButton').click();true");time.sleep(.12)
 # Signal drawer and original source.
 ev("document.querySelector('.signal-card').click();true");time.sleep(.32);checks['signal_detail_opens']=ev("document.querySelector('#detailDrawer').classList.contains('open') && !!document.querySelector('#detailDrawer a[href^=\"http\"]')");drawer_rect=ev("(()=>{const r=document.querySelector('#detailDrawer').getBoundingClientRect();return {left:r.left,right:r.right,width:r.width,innerWidth:window.innerWidth,docWidth:document.documentElement.clientWidth,scrollWidth:document.documentElement.scrollWidth}})()");checks['signal_drawer_fully_visible']=drawer_rect['left']>=0 and drawer_rect['right']<=drawer_rect['innerWidth']+1 and drawer_rect['width']>=480;shot('MERLIN_V8_SIGNAL_DETAIL.png');ev("document.querySelector('#closeDrawer').click();true");time.sleep(.1)
 # Map click on France at world view. Approximate position computed from current canvas projection in-page.
 ev("document.querySelector('#fitWorldButton').click();true");time.sleep(.1)
 # Use a helper only to compute the projected screen point; the click itself goes through Chromium input.
 fr=ev("(()=>{const c=document.querySelector('#mapCanvas'),r=c.getBoundingClientRect(),x=(2.2+180)/360,y=(1-Math.log(Math.tan(46.2*Math.PI/180)+1/Math.cos(46.2*Math.PI/180))/Math.PI)/2,s=r.width,centerX=.5,centerY=.47;return{x:r.left+r.width/2+(x-centerX)*s,y:r.top+r.height/2+(y-centerY)*s}})()")
 click(fr['x'],fr['y']);time.sleep(.18);checks['map_country_click_opens_country']=ev("document.querySelector('#detailDrawer').classList.contains('open') && /France/i.test(document.querySelector('#drawerContent').textContent)");ev("document.querySelector('#closeDrawer').click();document.querySelector('#fitWorldButton').click();true");time.sleep(.18)
 checks['no_desktop_horizontal_overflow']=ev("document.documentElement.scrollWidth<=document.documentElement.clientWidth")
 # Workspace checks and screenshots.
 shot('MERLIN_V8_DASHBOARD.png')
 ev("document.querySelector('#layerRows').scrollTop=9999;true");time.sleep(.1);shot('MERLIN_V8_OVERLAYS.png');ev("document.querySelector('#layerRows').scrollTop=0;true")
 ev("document.querySelector('[data-view=markets]').click();true");time.sleep(.15);checks['markets_workspace_populated']=ev("document.querySelectorAll('.market-card').length>=6 && document.querySelectorAll('#marketEventGrid .data-card').length>=3");shot('MERLIN_V8_MARKETS.png')
 ev("document.querySelector('[data-view=opportunities]').click();true");time.sleep(.15);checks['opportunities_workspace_populated']=ev("document.querySelectorAll('#opportunityGrid .data-card').length>=5");shot('MERLIN_V8_OPPORTUNITIES.png')
 ev("document.querySelector('[data-view=conflicts]').click();true");time.sleep(.12);checks['conflicts_workspace_populated']=ev("document.querySelectorAll('#conflictGrid .data-card').length>=2")
 ev("document.querySelector('[data-view=countries]').click();true");time.sleep(.12);checks['countries_workspace_populated']=ev("document.querySelectorAll('#countryGrid .country-card').length>=150");ev("document.querySelector('#countrySearch').value='Taiwan';document.querySelector('#countrySearch').dispatchEvent(new Event('input',{bubbles:true}));true");time.sleep(.08);checks['country_search_works']=ev("document.querySelectorAll('#countryGrid .country-card').length===1 && /Taiwan/.test(document.querySelector('#countryGrid').textContent)")
 ev("document.querySelector('[data-view=brief]').click();true");time.sleep(.12);checks['daily_brief_populated']=ev("document.querySelectorAll('#briefGrid .brief-row').length>=8")
 ev("document.querySelector('#sourceStatusButton').click();true");time.sleep(.32);checks['source_drawer_matches_catalog']=ev(f"document.querySelectorAll('#sourceDrawer .source-table tr').length==={len(snap['sourceStatuses'])}");checks['source_drawer_fully_visible']=ev("(()=>{const r=document.querySelector('#sourceDrawer').getBoundingClientRect();return r.left>=0&&r.right<=window.innerWidth+1&&r.width>=480})()");shot('MERLIN_V8_SOURCE_STATUS.png');ev("document.querySelector('#closeSourceDrawer').click();true")
 ev("document.querySelector('#searchButton').click();document.querySelector('#globalSearchInput').value='Taiwan';document.querySelector('#globalSearchInput').dispatchEvent(new Event('input',{bubbles:true}));true");time.sleep(.08);checks['global_search_works']=ev("document.querySelectorAll('#searchResults .search-result').length>=2");ev("document.querySelector('#closeSearch').click();true")
 # Mobile actual render.
 cmd('Emulation.setDeviceMetricsOverride',{'width':390,'height':844,'deviceScaleFactor':1,'mobile':True});ev("document.querySelector('[data-view=map]').click();window.dispatchEvent(new Event('resize'));true");time.sleep(.35);checks['mobile_map_visible']=ev("document.querySelector('#mapCanvas').getBoundingClientRect().height>=400");checks['mobile_signals_visible']=ev("document.querySelectorAll('.signal-card').length>=8");shot('MERLIN_V8_MOBILE.png')
 errors=[e for e in events if e.get('method')=='Runtime.exceptionThrown' or (e.get('method')=='Log.entryAdded' and e.get('params',{}).get('entry',{}).get('level')=='error')]
 checks['no_browser_errors']=len(errors)==0
 report={'checks':checks,'failed':[k for k,v in checks.items() if not v],'browserErrors':errors,'drawerRect':drawer_rect,'fixtureMode':snap['dataMode'],'fixtureSignals':len(snap['signals']),'fixtureMarkets':len(snap['markets']),'fixtureSources':len(snap['sourceStatuses']),'note':'Chromium DOM/canvas acceptance uses the exact production client and a timestamped BUILD SNAPSHOT fixture because the isolated browser cannot reach external publishers. No generated images are used.'}
 (out/'MERLIN_V8_BROWSER_REPORT.json').write_text(json.dumps(report,indent=2));print(json.dumps(report,indent=2))
 if report['failed']: sys.exit(1)
finally:
 try: chrome.terminate();chrome.wait(timeout=3)
 except:
  try: chrome.kill()
  except: pass
 shutil.rmtree(tmp,ignore_errors=True)
