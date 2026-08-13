from pathlib import Path
import subprocess,tempfile,time,json,urllib.request,shutil,websocket,base64,re,sys
root=Path(__file__).resolve().parents[1]
out=Path(sys.argv[1]) if len(sys.argv)>1 else root/'screenshots'
shutil.rmtree(out,ignore_errors=True);out.mkdir(parents=True)
fixture=out/'fixture.json';bundle=out/'test-bundle.js'
subprocess.run(['node','scripts/write-browser-fixture.js',str(fixture)],cwd=root,check=True,stdout=subprocess.PIPE,text=True)
subprocess.run(['node','scripts/build-browser-bundle.js',str(bundle)],cwd=root,check=True,stdout=subprocess.PIPE,text=True)
payload=json.loads(fixture.read_text());snapshot=payload['snapshot'];reference=payload['reference']
css=(root/'public/styles.css').read_text();html=(root/'public/index.html').read_text()
img=base64.b64encode((root/'public/assets/world-tech-equirect.jpg').read_bytes()).decode()
html=re.sub(r'<link rel="stylesheet" href="/vendor/maplibre-gl.css">\s*','',html)
html=re.sub(r'<link rel="stylesheet" href="/styles.css">',f'<style>{css}</style>',html)
html=html.replace('src="/assets/world-tech-equirect.jpg"',f'src="data:image/jpeg;base64,{img}"')
html=re.sub(r'<script type="module" src="/app.js"></script>','',html)
port=9366;tmp=Path(tempfile.mkdtemp(prefix='merlin-shot-'));profile=tmp/'chrome';profile.mkdir()
chrome=subprocess.Popen(['/usr/bin/chromium','--headless=new','--no-sandbox','--disable-gpu',f'--remote-debugging-port={port}','--remote-allow-origins=*',f'--user-data-dir={profile}','--window-size=1680,1000','about:blank'],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
def getj(url):return json.loads(urllib.request.urlopen(url,timeout=1).read())
try:
 page=None
 for _ in range(80):
  try:
   tabs=getj(f'http://127.0.0.1:{port}/json');page=next((x for x in tabs if x.get('type')=='page'),None)
  except: pass
  if page: break
  time.sleep(.1)
 if not page: raise RuntimeError('no page')
 ws=websocket.create_connection(page['webSocketDebuggerUrl'],timeout=10,origin=f'http://127.0.0.1:{port}')
 seq=0;events=[]
 def cmd(method,params=None):
  nonlocal_dummy=None
  global seq
  seq+=1;i=seq;ws.send(json.dumps({'id':i,'method':method,'params':params or {}}))
  while True:
   m=json.loads(ws.recv())
   if 'method'in m:events.append(m)
   if m.get('id')==i:
    if 'error'in m:raise RuntimeError(m['error'])
    return m.get('result',{})
 def ev(expr):
  r=cmd('Runtime.evaluate',{'expression':expr,'returnByValue':True,'awaitPromise':True})
  if 'exceptionDetails'in r:raise RuntimeError(str(r['exceptionDetails']))
  return r.get('result',{}).get('value')
 def shot(name):
  data=cmd('Page.captureScreenshot',{'format':'png','captureBeyondViewport':False}).get('data');(out/name).write_bytes(base64.b64decode(data))
 cmd('Runtime.enable');cmd('Page.enable');cmd('Log.enable')
 frame=cmd('Page.getFrameTree')['frameTree']['frame']['id'];cmd('Page.setDocumentContent',{'frameId':frame,'html':html})
 fixture_script=f"""(()=>{{const SNAP={json.dumps(snapshot)};const REF={json.dumps(reference)};window.fetch=async function(input,options={{}}){{const raw=typeof input==='string'?input:(input&&input.url)||'';let u;try{{u=new URL(raw,'https://merlin.test')}}catch{{u={{pathname:raw,searchParams:new URLSearchParams()}}}}let body={{}};if(u.pathname==='/api/reference')body=REF;else if(u.pathname==='/api/snapshot'){{const region=u.searchParams.get('region')||'world',hours=Number(u.searchParams.get('hours')||24),minScore=Number(u.searchParams.get('minScore')||52),category=u.searchParams.get('category')||'all',cutoff=Date.now()-hours*3600000;const signals=(SNAP.signals||[]).filter(s=>s.signalScore>=minScore&&Date.parse(s.publishedAt)>=cutoff&&(region==='world'||s.regionIds.includes(region))&&(category==='all'||s.category===category));body={{...SNAP,signals,filter:{{region,hours,minScore,category}}}};}}else if(u.pathname==='/api/sources')body={{refreshing:false,coverage:SNAP.sourceCoverage,sources:SNAP.sourceStatuses}};else if(u.pathname==='/api/refresh')body={{ok:true,generatedAt:SNAP.generatedAt}};return new Response(JSON.stringify(body),{{status:200,headers:{{'content-type':'application/json'}}}});}};}})()"""
 ev(fixture_script);ev(bundle.read_text())
 for _ in range(100):
  if ev("document.querySelectorAll('.event-card').length>=3 && document.querySelectorAll('.fb-event').length>=3 && document.querySelector('#demoBadge') && !document.querySelector('#demoBadge').classList.contains('hidden')"):break
  time.sleep(.1)
 time.sleep(.35)
 shot('MERLIN_V7_DASHBOARD.png')
 # lower layer controls, still on the world map
 ev("document.querySelector('.layer-content')?.scrollTo({top:999,behavior:'instant'});true");time.sleep(.12);shot('MERLIN_V7_OVERLAYS.png')
 ev("document.querySelector('.layer-content')?.scrollTo({top:0,behavior:'instant'});true");time.sleep(.12)
 # signal detail
 ev("document.querySelector('.event-card')?.click();true");time.sleep(.15);shot('MERLIN_V7_SIGNAL_DETAIL.png')
 ev("(()=>{const hs=[...document.querySelectorAll('#detailBody h3')];const h=hs.find(x=>x.textContent.includes('Public indicators detected'));if(h){h.scrollIntoView({block:'start'});document.querySelector('#detailBody').scrollTop=Math.max(0,document.querySelector('#detailBody').scrollTop-12)}return true})()");time.sleep(.12);shot('MERLIN_V7_PUBLIC_INDICATORS.png')
 ev("document.querySelector('[data-action=\"detail-close\"]')?.click();true");time.sleep(.35)
 # opportunities
 ev("document.querySelector('[data-view=\"opportunities\"]')?.click();true");time.sleep(.3);shot('MERLIN_V7_OPPORTUNITIES.png')
 # source coverage
 ev("document.querySelector('#sourceHealth')?.click();true");time.sleep(.12);shot('MERLIN_V7_SOURCE_COVERAGE.png')
 ev("document.querySelector('[data-action=\"sources-close\"]')?.click();document.querySelector('[data-view=\"markets\"]')?.click();true");time.sleep(.12);shot('MERLIN_V7_MARKET_IMPACT.png')
 # mobile map
 cmd('Emulation.setDeviceMetricsOverride',{'width':390,'height':844,'deviceScaleFactor':1,'mobile':True});ev("document.querySelector('[data-view=\"map\"]')?.click();window.dispatchEvent(new Event('resize'));true");time.sleep(.25);shot('MERLIN_V7_MOBILE.png')
 errs=[e for e in events if e.get('method')=='Runtime.exceptionThrown' or (e.get('method')=='Log.entryAdded' and e.get('params',{}).get('entry',{}).get('level')=='error')]
 report={'dashboardEvents':ev("document.querySelectorAll('.event-card').length"),'fallbackMarkers':ev("document.querySelectorAll('.fb-event').length"),'sourceRows':ev("document.querySelectorAll('.source-row').length"),'demoBadge':True,'browserErrors':errs}
 (out/'screenshot-report.json').write_text(json.dumps(report,indent=2));print(json.dumps(report,indent=2))
finally:
 try:chrome.terminate();chrome.wait(timeout=3)
 except:
  try:chrome.kill()
  except:pass
 shutil.rmtree(tmp,ignore_errors=True)
