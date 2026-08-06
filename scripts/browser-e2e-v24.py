#!/usr/bin/env python3
from __future__ import annotations
import asyncio, json, os, mimetypes
from datetime import datetime, timezone
from io import BytesIO
from pathlib import Path
from PIL import Image, ImageDraw
from playwright.async_api import async_playwright

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / '.tmp' / 'v24-browser'
BASE = 'http://merlin.local/'
PUBLIC = ROOT / 'public'

def now(): return datetime.now(timezone.utc).isoformat().replace('+00:00','Z')

def tile():
    im=Image.new('RGB',(256,256),'#112638'); d=ImageDraw.Draw(im)
    for x in range(0,257,32): d.line((x,0,x,256),fill='#18384d')
    for y in range(0,257,32): d.line((0,y,256,y),fill='#18384d')
    d.polygon([(0,10),(75,0),(140,42),(256,20),(256,145),(190,120),(106,175),(0,142)],fill='#1b3442')
    d.line((0,190,256,130),fill='#235b6b',width=6)
    b=BytesIO(); im.save(b,'PNG'); return b.getvalue()
TILE=tile()

def snapshot():
    t=now()
    raw=[
      ('a1','Red Sea shipping capacity tightens after port closure','Carriers are diverting vessels and exporters are seeking alternative capacity.','disruption',15.6,42.8,'Yemen','YE','BBC World'),
      ('a2','Ukraine reports renewed missile attacks near Kyiv','Officials reported new strikes while regional transport remained disrupted.','conflict',50.45,30.52,'Ukraine','UA','BBC World'),
      ('a3','Copper supply guidance cut after Chile mine disruption','Industrial buyers are reviewing alternative concentrate suppliers.','markets',-33.45,-70.67,'Chile','CL','The Guardian Business'),
      ('a4','Singapore container rates rise as capacity shifts','Spot freight prices increased on Asia to Europe routes.','disruption',1.29,103.85,'Singapore','SG','GDELT'),
      ('a5','European manufacturers seek new gas contracts','Industrial firms are checking alternative suppliers and delivery terms.','markets',52.52,13.4,'Berlin','DE','BBC Business'),
      ('a6','Election result changes trade policy outlook in Poland','Exporters are assessing possible regulatory changes.','politics',52.23,21.01,'Warsaw','PL','Le Monde World'),
      ('a7','Border restrictions slow food deliveries in Jordan','Wholesalers are searching for nearby replacement suppliers.','disruption',31.95,35.91,'Jordan','JO','Al Jazeera'),
      ('a8','Ceasefire talks resume after overnight fighting in Lebanon','Cross-border trade remains restricted while talks continue.','conflict',33.89,35.5,'Lebanon','LB','GDELT'),
      ('a9','Rotterdam terminal outage delays export loading','Operators expect short delays and carriers are checking nearby ports.','disruption',51.95,4.13,'Rotterdam','NL','BBC Business'),
      ('a10','Japan manufacturers raise semiconductor output forecast','Supply expectations improved across several electronics categories.','markets',35.68,139.69,'Tokyo','JP','The Guardian Business')
    ]
    article_regions={
      'a1':['middle-east'],'a2':['europe'],'a3':[],'a4':['major-asia'],'a5':['europe'],
      'a6':['europe'],'a7':['middle-east'],'a8':['middle-east'],'a9':['europe'],'a10':['major-asia']
    }
    articles=[]
    for i,title,summary,cat,lat,lon,loc,code,source in raw:
        focus_ids=article_regions[i]
        articles.append({'id':i,'title':title,'summary':summary,'url':f'https://example.com/{i}','source':source,'sourceDomain':'example.com','sourceQuality':82,'publishedAt':t,'category':cat,'impact':{'conflict':'Security and regional risk','disruption':'Transport or supply disruption','markets':'Market-moving development','politics':'Political or regulatory change'}[cat],'coordinates':{'lat':lat,'lon':lon},'location':{'name':loc,'country':loc,'countryCode':code,'localName':''},'focusRegionIds':focus_ids,'priorityCoverage':bool(focus_ids)})
    opp=[]
    for index,a in enumerate(articles[:8]):
        opp.append({'id':'opp-'+a['id'],'type':'news','title':a['title'],'score':82-index*3,'evidence':f"{a['source']} · {a['location']['name']}",'observedAt':t,'customer':'Importers, distributors and firms exposed to this change','whyItMatters':a['impact']+' may change availability, cost or customer demand.','action':'Identify the affected buyer, verify the change with a second source and compare available alternatives.','risk':'The effect may be short-lived or already reflected in prices.','sourceUrl':a['url'],'articleId':a['id'],'coordinates':a['coordinates'],'focusRegionIds':a['focusRegionIds']})
    markets=[
      {'id':'bitcoin','symbol':'BTC','name':'Bitcoin','price':64784,'change24h':2.42,'updatedAt':t,'source':'CoinGecko'},
      {'id':'ethereum','symbol':'ETH','name':'Ethereum','price':3410,'change24h':1.18,'updatedAt':t,'source':'CoinGecko'},
      {'id':'solana','symbol':'SOL','name':'Solana','price':169.4,'change24h':-0.84,'updatedAt':t,'source':'CoinGecko'},
      {'id':'cardano','symbol':'ADA','name':'Cardano','price':0.462,'change24h':3.2,'updatedAt':t,'source':'CoinGecko'}]
    countries=[]
    for a in articles:
        countries.append({'countryCode':a['location']['countryCode'],'country':a['location']['country'],'count':1,'latestAt':t,'categories':[a['category']],'articleIds':[a['id']]})
    focus_regions=[
      {'id':'middle-east','label':'Middle East','shortLabel':'Middle East','centre':{'lat':29,'lon':44},'zoom':4,'description':'Energy, shipping, sanctions and regional trade.','watchTopics':['Red Sea shipping','Gulf energy exports','airspace and aviation'],'industries':['energy','shipping'],'corridors':['Suez and Red Sea'],'countryCodes':['YE','JO','LB'],'counts':{'current':3,'conflict':1,'disruption':2,'opportunities':3,'countries':3,'ports':6,'routes':3}},
      {'id':'europe','label':'Europe','shortLabel':'Europe','centre':{'lat':51,'lon':13},'zoom':4,'description':'Industry, energy, regulation and European security.','watchTopics':['Ukraine and European security','energy and power costs','EU regulation'],'industries':['manufacturing','energy'],'corridors':['Baltic routes'],'countryCodes':['UA','DE','PL','NL'],'counts':{'current':4,'conflict':1,'disruption':1,'opportunities':4,'countries':4,'ports':12,'routes':5}},
      {'id':'russia','label':'Russia','shortLabel':'Russia','centre':{'lat':57,'lon':55},'zoom':3,'description':'Sanctions, energy and export corridors.','watchTopics':['sanctions enforcement','energy export routes'],'industries':['energy','metals'],'corridors':['Baltic export routes'],'countryCodes':['RU'],'counts':{'current':0,'conflict':0,'disruption':0,'opportunities':0,'countries':1,'ports':4,'routes':2}},
      {'id':'major-asia','label':'Major Asia','shortLabel':'Asia','centre':{'lat':31,'lon':104},'zoom':3,'description':'Manufacturing, technology and trade routes.','watchTopics':['semiconductor supply','Asian manufacturing orders'],'industries':['technology','manufacturing'],'corridors':['Malacca Strait'],'countryCodes':['SG','JP'],'counts':{'current':2,'conflict':0,'disruption':1,'opportunities':2,'countries':2,'ports':10,'routes':4}},
      {'id':'north-africa','label':'North Africa','shortLabel':'North Africa','centre':{'lat':29,'lon':13},'zoom':4,'description':'Suez, energy, food imports and European trade.','watchTopics':['Suez Canal traffic','food import pressure'],'industries':['shipping','energy'],'corridors':['Suez Canal'],'countryCodes':['EG','MA','DZ'],'counts':{'current':0,'conflict':0,'disruption':0,'opportunities':0,'countries':3,'ports':8,'routes':4}},
      {'id':'united-states','label':'United States','shortLabel':'United States','centre':{'lat':39,'lon':-98},'zoom':3,'description':'Markets, technology, energy and global demand.','watchTopics':['Federal Reserve and inflation','technology regulation'],'industries':['finance','technology'],'corridors':['Trans-Pacific'],'countryCodes':['US'],'counts':{'current':0,'conflict':0,'disruption':0,'opportunities':0,'countries':1,'ports':8,'routes':4}}
    ]
    priority_countries=[
      {'iso2':'YE','name':'Yemen','nativeName':'اليمن','lat':15.5,'lon':47.5,'focusRegionIds':['middle-east'],'activityCount':1,'portCount':2,'routeCount':2,'categories':['disruption'],'priorityCoverage':True},
      {'iso2':'UA','name':'Ukraine','nativeName':'Україна','lat':49,'lon':32,'focusRegionIds':['europe'],'activityCount':1,'portCount':3,'routeCount':2,'categories':['conflict'],'priorityCoverage':True},
      {'iso2':'RU','name':'Russia','nativeName':'Россия','lat':61,'lon':90,'focusRegionIds':['russia'],'activityCount':0,'portCount':5,'routeCount':3,'categories':[],'priorityCoverage':True},
      {'iso2':'SG','name':'Singapore','nativeName':'Singapore','lat':1.35,'lon':103.82,'focusRegionIds':['major-asia'],'activityCount':1,'portCount':1,'routeCount':3,'categories':['disruption'],'priorityCoverage':True},
      {'iso2':'EG','name':'Egypt','nativeName':'مصر','lat':26.8,'lon':30.8,'focusRegionIds':['middle-east','north-africa'],'activityCount':0,'portCount':4,'routeCount':4,'categories':[],'priorityCoverage':True},
      {'iso2':'US','name':'United States','nativeName':'United States','lat':39.8,'lon':-98.6,'focusRegionIds':['united-states'],'activityCount':0,'portCount':8,'routeCount':5,'categories':[],'priorityCoverage':True}
    ]
    watch_areas=[
      {'id':'red-sea','regionId':'middle-east','title':'Red Sea and Bab el-Mandeb','lat':13.5,'lon':43.3,'type':'shipping','why':'Connects Asia–Europe shipping through Suez.','sectors':['shipping','energy']},
      {'id':'ukraine-black-sea','regionId':'europe','title':'Ukraine and Black Sea','lat':46.2,'lon':33.8,'type':'security','why':'Security affects grain, energy and insurance.','sectors':['agriculture','energy']},
      {'id':'taiwan-strait','regionId':'major-asia','title':'Taiwan Strait','lat':24.5,'lon':119.5,'type':'technology','why':'Security can affect semiconductor supply.','sectors':['semiconductors','shipping']},
      {'id':'suez','regionId':'north-africa','title':'Suez Canal','lat':30.4,'lon':32.4,'type':'shipping','why':'The principal Europe–Asia shortcut.','sectors':['shipping','retail']},
      {'id':'us-gulf','regionId':'united-states','title':'US Gulf Coast','lat':29.2,'lon':-91.5,'type':'energy','why':'Globally important energy and industrial corridor.','sectors':['oil','lng']}
    ]
    return {'version':'24.1.0','status':'LIVE','windowHours':12,'generatedAt':t,'newestAt':t,'articles':articles,'mappedArticles':articles,'conflicts':[a for a in articles if a['category']=='conflict'],'markets':markets,'opportunities':opp,'countries':countries,'focusRegions':focus_regions,'priorityCountries':priority_countries,'watchAreas':watch_areas,'ports':[],'routes':[],'sources':[{'id':'gdelt','name':'GDELT','state':'ONLINE','recordCount':10},{'id':'bbc-world','name':'BBC World','state':'ONLINE','recordCount':4},{'id':'bbc-business','name':'BBC Business','state':'ONLINE','recordCount':3},{'id':'guardian-business','name':'The Guardian Business','state':'ONLINE','recordCount':3}], 'counts':{'articles':10,'mappedArticles':10,'conflicts':2,'opportunities':8,'markets':4,'ports':75,'routes':15,'focusRegions':6,'priorityCountries':6,'watchAreas':5,'onlineSources':4}}

async def run():
    OUT.mkdir(parents=True,exist_ok=True)
    import subprocess, sys
    subprocess.run([sys.executable,str(ROOT/'scripts/build-merlin-browser-bundle.py')],cwd=ROOT,check=True)
    async with async_playwright() as p:
        browser=await p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
        results=[]
        for name,width,height in [('desktop',1440,900),('mobile',390,844)]:
            ctx=await browser.new_context(viewport={'width':width,'height':height},device_scale_factor=1,reduced_motion='reduce')
            page=await ctx.new_page(); errors=[]; console=[]
            page.on('pageerror',lambda e: errors.append(str(e)))
            page.on('console',lambda m: console.append(m.text) if m.type=='error' else None)
            async def route_handler(route):
                url=route.request.url
                if '/api/customer/snapshot' in url:
                    await route.fulfill(status=200,content_type='application/json',body=json.dumps(snapshot())); return
                if url.startswith('http://merlin.local/'):
                    from urllib.parse import urlparse
                    parsed=urlparse(url)
                    rel=parsed.path.lstrip('/') or 'index.html'
                    local=(PUBLIC/rel).resolve()
                    if PUBLIC.resolve() in local.parents and local.is_file():
                        await route.fulfill(status=200,content_type=mimetypes.guess_type(local.name)[0] or 'application/octet-stream',body=local.read_bytes()); return
                    await route.fulfill(status=404,body='not found'); return
                if 'basemaps.cartocdn.com' in url or 'tile.openstreetmap.org' in url or 'opentopomap.org' in url:
                    await route.fulfill(status=200,content_type='image/png',body=TILE); return
                await route.fulfill(status=204,body='')
            await page.route('**/*',route_handler)
            html=(PUBLIC/'index.html').read_text(encoding='utf-8')
            import re
            html=re.sub(r'<script\s+type="module"\s+src="[^"]+"></script>','',html).replace('<head>','<head><base href="http://merlin.local/">',1)
            await page.set_content(html,wait_until='load')
            bundle=(ROOT/'.tmp'/'merlin-browser-bundle.js').read_text(encoding='utf-8')
            await page.add_script_tag(content=bundle)
            await page.wait_for_selector('.merlin-v20-map',timeout=15000)
            await page.wait_for_function("Number(document.querySelector('#header-event-count')?.textContent || 0) >= 8",timeout=15000)
            await page.wait_for_timeout(700)
            checks={}
            checks['map-ready']=await page.locator('.merlin-v20-map').count()==1
            checks['current-feed']=await page.locator('.feed-card').count()>=8
            checks['clickable-markers']=await page.locator('[data-map-entity]').count()>=12
            checks['regional-selector']=await page.locator('[data-region-focus]').count()==8
            checks['priority-country-markers']=await page.locator('[data-map-entity]').count()>=12
            checks['english-labels']=await page.locator('.merlin-v20-label-english').count()>5
            checks['logo-loaded']=await page.locator('.brand-mark svg').count()==1
            body=(await page.locator('body').inner_text()).lower()
            checks['no-internal-admin']=not any(x in body for x in ['operations','security','release control','automation','operator console','command centre'])
            checks['no-seismic-feed']='earthquake' not in body and 'seismic' not in body
            checks['feed-scroll']=await page.locator('.feed-list').evaluate("e=>getComputedStyle(e).overflowY==='auto'")
            if width>=900:
                await page.locator('[data-region-focus="middle-east"]').click()
                await page.wait_for_timeout(120)
                checks['middle-east-focus']='Middle East' in await page.locator('#region-focus-summary').inner_text()
                await page.locator('.merlin-v20-marker').first.evaluate("el=>el.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true,view:window}))")
                await page.wait_for_timeout(150)
                checks['detail-opens']=await page.locator('#detail-panel:not(.is-hidden)').count()==1
                checks['detail-scroll']=await page.locator('.detail-body').evaluate("e=>getComputedStyle(e).overflowY==='auto'")
                if await page.locator('#detail-panel:not(.is-hidden)').count():
                    await page.locator('#detail-close').evaluate('(el)=>el.click()')
                for view,selector in [('opportunities','.workspace-grid .content-card'),('markets','.market-table tbody tr'),('conflicts','.workspace-grid .content-card'),('countries','.country-table tbody tr'),('briefing','.brief-section')]:
                    await page.locator(f'.nav-item[data-view="{view}"]').click()
                    await page.wait_for_timeout(100)
                    checks[view+'-populated']=await page.locator(selector).count()>0
                await page.locator('.nav-item[data-view="map"]').click()
            else:
                await page.locator('#mobile-menu').click()
                checks['mobile-nav']=await page.locator('.app-shell.mobile-nav-open').count()==1
            checks['no-horizontal-overflow']=await page.evaluate('document.documentElement.scrollWidth <= innerWidth + 2')
            checks['no-page-errors']=not errors
            checks['no-console-errors']=not console
            await page.screenshot(path=str(OUT/f'{name}.png'),full_page=True)
            if name == 'desktop':
                await page.locator('.nav-item[data-view="briefing"]').click()
                await page.wait_for_timeout(150)
                await page.screenshot(path=str(OUT/'daily-briefing.png'),full_page=True)
                await page.locator('.nav-item[data-view="map"]').click()
            results.append({'name':name,'checks':checks,'errors':errors,'console':console})
            await ctx.close()
        failed=[f"{r['name']}:{k}" for r in results for k,v in r['checks'].items() if not v]
        (OUT/'report.json').write_text(json.dumps({'results':results,'failed':failed},indent=2))
        print(json.dumps({'failed':failed,'output':str(OUT)},indent=2))
        await browser.close()
        return 1 if failed else 0

if __name__=='__main__':
    import os, traceback
    code = 1
    try:
        code = asyncio.run(run())
    except Exception:
        traceback.print_exc()
        code = 1
    try:
        import sys
        sys.stdout.flush(); sys.stderr.flush()
    finally:
        os._exit(code)
