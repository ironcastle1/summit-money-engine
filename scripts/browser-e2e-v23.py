#!/usr/bin/env python3
from __future__ import annotations
import asyncio, json, mimetypes, os, re, subprocess, sys
from io import BytesIO
from pathlib import Path
from urllib.parse import urlparse
from PIL import Image, ImageDraw
from playwright.async_api import async_playwright

ROOT=Path(__file__).resolve().parents[1]
PUBLIC=ROOT/'public'
OUTPUT=ROOT/'.tmp'/'v23-browser'
BUNDLE=ROOT/'.tmp'/'merlin-browser-bundle.js'
VIEWPORTS=[('desktop',1440,900),('mobile',390,844)]

def tile_bytes():
    image=Image.new('RGB',(256,256),'#e7eef0'); draw=ImageDraw.Draw(image)
    for v in range(0,257,32):
        draw.line((v,0,v,256),fill='#cdd9dd',width=1); draw.line((0,v,256,v),fill='#cdd9dd',width=1)
    draw.polygon([(0,20),(80,0),(150,45),(256,28),(256,150),(190,120),(105,180),(0,145)],fill='#d8e0d0')
    draw.line((0,180,256,130),fill='#9dbfc9',width=7)
    buf=BytesIO(); image.save(buf,format='PNG'); return buf.getvalue()
TILE=tile_bytes()

def now_iso():
    from datetime import datetime, timezone
    return datetime.now(timezone.utc).isoformat().replace('+00:00','Z')

def fixtures(path):
    now=now_iso()
    clean=path.split('?',1)[0]
    if clean=='/api/events':
        return {'events':[
          {'id':'e1','title':'Red Sea shipping disrupted after port closure','summary':'Commercial vessels are rerouting while the port remains closed.','category':'transport','lat':15.6,'lon':42.8,'country':'Yemen','countryCode':'YE','severity':82,'time':now,'source':'Public maritime alert','url':'https://example.com/e1'},
          {'id':'e2','title':'Black Sea grain terminal reports temporary outage','summary':'Export loading is delayed and traders are checking alternative terminals.','category':'infrastructure','lat':46.5,'lon':30.7,'country':'Ukraine','countryCode':'UA','severity':67,'time':now,'source':'Port authority','url':'https://example.com/e2'},
          {'id':'e3','title':'Wildfire closes freight corridor in southern Europe','summary':'Road freight faces delays and local distribution capacity is constrained.','category':'wildfire','lat':38.7,'lon':-9.1,'country':'Portugal','countryCode':'PT','severity':58,'time':now,'source':'Civil protection service','url':'https://example.com/e3'},
          {'id':'e4','title':'Ceasefire talks resume after overnight fighting','summary':'Negotiations resumed while cross-border trade remains restricted.','category':'conflict','lat':33.9,'lon':35.5,'country':'Lebanon','countryCode':'LB','severity':73,'time':now,'source':'Public news agencies','url':'https://example.com/e4'}
        ],'sources':{'public-events':{'state':'ONLINE'}},'totalCount':4,'filteredCount':4,'generatedAt':now}
    if clean=='/api/news':
        return {'articles':[
          {'id':'n1','title':'Copper prices rise as mine supply tightens','summary':'Buyers are looking for alternative concentrate supply after production guidance fell.','publishedAt':now,'sourceName':'Market wire','sourceDomain':'example.com','countries':['CL'],'category':'business','url':'https://example.com/n1'},
          {'id':'n2','title':'European manufacturers seek alternative gas contracts','summary':'Industrial buyers are reviewing shorter routes and new suppliers.','publishedAt':now,'sourceName':'Trade journal','sourceDomain':'example.com','countries':['DE'],'category':'business','url':'https://example.com/n2'},
          {'id':'n3','title':'Container rates increase on Asia to Europe lanes','summary':'Diversions and tighter capacity are lifting spot freight prices.','publishedAt':now,'sourceName':'Shipping report','sourceDomain':'example.com','countries':['SG'],'category':'transport','url':'https://example.com/n3'},
          {'id':'n4','title':'Border restrictions slow regional food deliveries','summary':'Wholesalers are seeking nearby replacement suppliers.','publishedAt':now,'sourceName':'Regional news','sourceDomain':'example.com','countries':['JO'],'category':'conflict','url':'https://example.com/n4'}
        ],'stories':[],'sources':{'public-news':{'state':'ONLINE'}},'articleCount':4,'storyCount':4,'generatedAt':now}
    if clean=='/api/markets/screener':
        return {'results':[
          {'asset':{'id':'btc','symbol':'BTC','name':'Bitcoin'},'quote':{'price':64784,'change24h':0.0064},'source':{'id':'coinbase'}},
          {'asset':{'id':'copper','symbol':'COPPER','name':'Copper'},'quote':{'price':4.72,'change24h':0.031},'source':{'id':'public-market'}},
          {'asset':{'id':'oil','symbol':'BRENT','name':'Brent crude'},'quote':{'price':81.42,'change24h':-0.012},'source':{'id':'public-market'}},
          {'asset':{'id':'eurusd','symbol':'EURUSD','name':'Euro / US dollar'},'quote':{'price':1.087,'change24h':0.0021},'source':{'id':'ecb'}}
        ],'generatedAt':now}
    if clean=='/api/opportunities':
        return {'opportunities':[
          {'id':'o1','kind':'EVENT','title':'Alternative freight capacity on Asia–Europe routes','subtitle':'Shipping','score':78,'confidence':70,'risk':58,'observedAt':now,'summary':'Container diversions are tightening capacity and may increase demand for alternative carriers and routes.','nextCheck':'Compare live freight quotes and identify exporters facing urgent capacity gaps.'},
          {'id':'o2','kind':'MARKET','title':'Copper supply tightness research lead','subtitle':'Commodities','score':72,'confidence':66,'risk':61,'observedAt':now,'summary':'Mine guidance and buyer behaviour point to tighter near-term supply.','nextCheck':'Check inventories, treatment charges and exposed producers before acting.'}
        ],'generatedAt':now}
    return None

def stripped_html():
    html=(PUBLIC/'index.html').read_text(encoding='utf-8')
    html=re.sub(r'<script\s+type="module"\s+src="[^"]+"></script>','',html)
    return html.replace('<head>','<head><base href="http://merlin.local/">',1)

async def route_request(route):
    req=route.request; parsed=urlparse(req.url); path=parsed.path+('?' + parsed.query if parsed.query else '')
    if parsed.hostname=='merlin.local':
        if parsed.path.startswith('/api/'):
            payload=fixtures(path)
            if payload is None:
                await route.fulfill(status=404,content_type='application/json',body=json.dumps({'error':{'message':'fixture unavailable'}})); return
            await route.fulfill(status=200,content_type='application/json',body=json.dumps(payload)); return
        local=(PUBLIC/parsed.path.lstrip('/')).resolve()
        if PUBLIC.resolve() in local.parents and local.is_file():
            await route.fulfill(status=200,content_type=mimetypes.guess_type(local.name)[0] or 'application/octet-stream',body=local.read_bytes()); return
        await route.fulfill(status=404,body='not found'); return
    if req.resource_type=='image' or 'cartocdn.com' in req.url:
        await route.fulfill(status=200,content_type='image/png',body=TILE); return
    await route.fulfill(status=204,body='')

async def run_viewport(browser,name,width,height):
    context=await browser.new_context(viewport={'width':width,'height':height},device_scale_factor=1,reduced_motion='reduce')
    page=await context.new_page(); errors=[]; console=[]; failures=[]
    page.on('pageerror',lambda e: errors.append(str(e)))
    page.on('console',lambda m: console.append(m.text) if m.type=='error' else None)
    page.on('requestfailed',lambda r: failures.append(r.url))
    await page.route('**/*',route_request)
    await page.set_content(stripped_html(),wait_until='load')
    await page.add_script_tag(content=BUNDLE.read_text(encoding='utf-8'))
    await page.wait_for_selector('#world-map.map-ready',timeout=20_000)
    await page.wait_for_function("document.querySelector('#event-count')?.textContent !== '0'",timeout=20_000)
    await page.wait_for_timeout(500)
    checks={}
    checks['map-ready']=await page.locator('#world-map.map-ready').count()==1
    checks['markers-visible']=await page.locator('[data-map-entity]').count()>=10
    checks['current-data']=int((await page.locator('#event-count').inner_text()).replace(',',''))>=4 and int((await page.locator('#news-count').inner_text()).replace(',',''))>=4
    body=(await page.locator('body').inner_text()).lower()
    checks['no-earthquakes']='earthquake' not in body and 'seismic' not in body
    checks['no-admin-larp']=not any(term in body for term in ['operations workspace','security workspace','release control','operator console','command centre'])
    checks['no-theme-control']=await page.locator('#theme-select').count()==0
    checks['inline-logo']=await page.locator('.brand-mark svg').count()==1
    checks['english-labels']=await page.locator('.merlin-v20-label-english').count()>0
    checks['scrollbars']=await page.locator('.live-feed').evaluate("el => ['auto','scroll'].includes(getComputedStyle(el).overflowY)") and await page.locator('.detail-body').evaluate("el => ['auto','scroll'].includes(getComputedStyle(el).overflowY)")
    OUTPUT.mkdir(parents=True,exist_ok=True)
    await page.screenshot(path=str(OUTPUT/f'{name}-map.png'),full_page=True)
    # Open a real marker and detail drawer.
    marker=page.locator('.merlin-v20-cluster, .merlin-v20-marker').first
    await marker.click(force=True)
    await page.wait_for_timeout(200)
    checks['clickable-map']=await page.locator('#detail-panel.open').count()==1
    checks['detail-content']=len((await page.locator('#detail-title').inner_text()).strip())>3
    await page.locator('#detail-close').click()
    # Search and key customer workspaces.
    await page.locator('#map-search-toggle').click(); checks['search-opens']=await page.locator('#map-search').evaluate("el=>el.classList.contains('open')")
    await page.locator('#global-search').fill('London'); await page.wait_for_timeout(100); checks['search-results']=await page.locator('.search-result').count()>0
    await page.keyboard.press('Escape')
    if width >= 900:
        for view,selector in [('opportunities','#opportunity-grid .opportunity-card'),('markets','#market-grid .market-card'),('conflicts','#conflict-list .story-row'),('countries','#country-grid .country-card'),('briefing','#briefing-content .briefing-card')]:
            await page.locator(f'.nav-item[data-view="{view}"]').click()
            await page.wait_for_timeout(120)
            checks[f'{view}-populated']=await page.locator(selector).count()>0
    else:
        await page.locator('#mobile-menu').click()
        checks['mobile-menu-opens']=await page.locator('.sidebar.open').count()==1
        await page.locator('.sidebar').evaluate("el=>el.classList.remove('open')")
    checks['no-horizontal-overflow']=await page.evaluate('document.body.scrollWidth <= innerWidth + 2')
    checks['no-page-errors']=not errors
    checks['no-console-errors']=not console
    checks['no-failed-local-requests']=not [u for u in failures if u.startswith('http://merlin.local/')]
    OUTPUT.mkdir(parents=True,exist_ok=True)
    await page.screenshot(path=str(OUTPUT/f'{name}.png'),full_page=True)
    result={'name':name,'viewport':{'width':width,'height':height},'checks':checks,'errors':errors,'console':console,'failures':failures}
    await context.close(); return result

async def main():
    subprocess.run([sys.executable,str(ROOT/'scripts/build-merlin-browser-bundle.py')],cwd=ROOT,check=True)
    OUTPUT.mkdir(parents=True,exist_ok=True)
    pw=await async_playwright().start()
    browser=await pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
    results=[]
    for vp in VIEWPORTS: results.append(await run_viewport(browser,*vp))
    failed=[f"{r['name']}:{k}" for r in results for k,v in r['checks'].items() if not v]
    report={'browser':'Chromium','results':results,'failed':failed}
    (OUTPUT/'report.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
    print(json.dumps({'failed':failed,'screenshots':str(OUTPUT)},indent=2),flush=True)
    code=1 if failed else 0
    try:
        await asyncio.wait_for(browser.close(),timeout=3)
    except Exception:
        pass
    os._exit(code)

if __name__=='__main__': raise SystemExit(asyncio.run(main()))
