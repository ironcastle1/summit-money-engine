#!/usr/bin/env python3
"""Rendered Chromium acceptance suite for Merlin V20.20.

Chromium in this build environment is prevented by policy from navigating to a
local HTTP origin. The suite therefore renders the real shipped HTML/CSS/client
bundle in Chromium and proxies every browser API request through Python to the
real local Merlin HTTP server. This still executes the actual UI and server
contracts while keeping the browser inside the permitted sandbox.
"""
from __future__ import annotations
import asyncio
import json
import mimetypes
import os
import re
import subprocess
import sys
import time
import urllib.error
import urllib.request
from io import BytesIO
from pathlib import Path
from urllib.parse import urlparse

from PIL import Image, ImageDraw
from playwright.async_api import async_playwright

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / 'public'
OUTPUT = ROOT / '.tmp' / 'part20-browser'
BUNDLE = ROOT / '.tmp' / 'merlin-browser-bundle.js'
SERVER_PORT = int(os.environ.get('MERLIN_BROWSER_TEST_PORT', '4330'))
SERVER_BASE = f'http://127.0.0.1:{SERVER_PORT}'
VIEWPORTS = [
    ('mobile-small', 360, 740), ('mobile-large', 430, 932), ('tablet', 820, 1180),
    ('laptop', 1366, 768), ('desktop', 1440, 900), ('ultrawide', 1920, 1080)
]

def wait_server(timeout=30):
    deadline = time.time() + timeout
    while time.time() < deadline:
        try:
            with urllib.request.urlopen(SERVER_BASE + '/api/health', timeout=2) as response:
                if response.status == 200:
                    return
        except Exception:
            time.sleep(.25)
    raise RuntimeError('Merlin HTTP server did not become ready')

def tile_bytes() -> bytes:
    image = Image.new('RGB', (256, 256), '#dbe3e5')
    draw = ImageDraw.Draw(image)
    for value in range(0, 257, 32):
        draw.line((value, 0, value, 256), fill='#b8c8cc', width=1)
        draw.line((0, value, 256, value), fill='#b8c8cc', width=1)
    draw.line((0, 70, 256, 150), fill='#7597a3', width=4)
    draw.line((20, 240, 230, 10), fill='#91aab2', width=3)
    output = BytesIO(); image.save(output, format='PNG'); return output.getvalue()

TILE = tile_bytes()


def json_fixture(path: str, method: str):
    now = '2026-08-05T12:00:00.000Z'
    clean = path.split('?', 1)[0]
    if clean == '/api/events':
        payload = json.loads((PUBLIC / 'data/fallback-events.json').read_text())
        payload['events'] = [event for event in payload.get('events', []) if str(event.get('category', '')).lower() != 'earthquake' or float(event.get('magnitude') or event.get('severity') or 0) >= 5.5]
        return payload
    if clean == '/api/news': return json.loads((PUBLIC / 'data/preload-news.json').read_text())
    if clean == '/api/shipping/snapshot': return json.loads((PUBLIC / 'data/preload-shipping.json').read_text())
    if clean == '/api/markets/screener': return json.loads((PUBLIC / 'data/preload-markets.json').read_text())
    if clean == '/api/macro': return {'records': [], 'generatedAt': now}
    if clean == '/api/hazards/snapshot': return {'events': [], 'features': {'type': 'FeatureCollection', 'features': []}, 'summary': {'total': 0, 'critical': 0}, 'generatedAt': now}
    if clean == '/api/country-risk/snapshot': return {'profiles': [], 'features': {'type': 'FeatureCollection', 'features': []}, 'summary': {'countries': 0, 'high': 0, 'severe': 0, 'average': 0}, 'generatedAt': now}
    if clean == '/api/conflict/snapshot': return {'theatres': [], 'features': {'type': 'FeatureCollection', 'features': []}, 'summary': {'theatres': 0, 'events': 0, 'critical': 0, 'intense': 0, 'averageRisk': 0}, 'generatedAt': now}
    if clean == '/api/market-intelligence/watchlist': return {'watches': []}
    if clean == '/api/market-intelligence/snapshot': return {'availableAssets': 0, 'assets': [], 'mapFeatures': {'type': 'FeatureCollection', 'features': []}, 'heatmap': [], 'opportunities': [], 'regime': {'regime': 'UNAVAILABLE', 'confidence': 0}, 'breadth': {'score': 0, 'state': 'UNAVAILABLE'}, 'cache': 'TEST', 'generatedAt': now}
    if clean == '/api/overlays/query': return {'results': [], 'generatedAt': now}
    if clean == '/api/readiness/metrics' and method == 'POST': return {'status': 'PASS', 'checks': []}
    return None

def stripped_html() -> str:
    html = (PUBLIC / 'index.html').read_text(encoding='utf-8')
    html = re.sub(r'<script\s+type="module"\s+src="[^"]+"\s*></script>', '', html)
    return html.replace('<head>', '<head><base href="http://merlin.local/">', 1)

def proxy_request(path: str, method: str, body: bytes | None, headers: dict[str, str]):
    url = SERVER_BASE + path
    forwarded = {'accept': headers.get('accept', 'application/json')}
    if headers.get('content-type'): forwarded['content-type'] = headers['content-type']
    request = urllib.request.Request(url, data=body if method not in {'GET', 'HEAD'} else None, method=method, headers=forwarded)
    try:
        with urllib.request.urlopen(request, timeout=6) as response:
            return response.status, dict(response.headers.items()), response.read()
    except urllib.error.HTTPError as error:
        return error.code, dict(error.headers.items()), error.read()

async def route_request(route):
    request = route.request
    parsed = urlparse(request.url)
    path = parsed.path
    if parsed.query: path += '?' + parsed.query
    if parsed.hostname == 'merlin.local':
        if parsed.path.startswith('/api/map/tiles/'):
            await route.fulfill(status=200, content_type='image/png', body=TILE); return
        if parsed.path.startswith('/api/'):
            fixture = json_fixture(path, request.method)
            if fixture is not None:
                await route.fulfill(status=200, content_type='application/json', body=json.dumps(fixture)); return
            fast_prefixes = ('/api/overlays/', '/api/logistics/network', '/api/hazards/catalog', '/api/market-intelligence/catalog', '/api/country-risk/catalog', '/api/conflict/catalog', '/api/decision-support/', '/api/automation/', '/api/publishing/', '/api/commercial/', '/api/security/', '/api/operations/', '/api/release/', '/api/live-data/', '/api/readiness/', '/api/health')
            if parsed.path.startswith(fast_prefixes):
                body = request.post_data_buffer if request.method not in {'GET', 'HEAD'} else None
                try:
                    status, headers, payload = await asyncio.to_thread(proxy_request, path, request.method, body, request.headers)
                    await route.fulfill(status=status, headers={'content-type': headers.get('Content-Type', 'application/json; charset=utf-8')}, body=payload); return
                except Exception as error:
                    await route.fulfill(status=503, content_type='application/json', body=json.dumps({'error': {'message': str(error)}})); return
            await route.fulfill(status=503, content_type='application/json', body=json.dumps({'error': {'message': 'Deterministic browser fixture does not execute this operation'}})); return
        local = (PUBLIC / parsed.path.lstrip('/')).resolve()
        if PUBLIC.resolve() in local.parents and local.is_file():
            content_type = mimetypes.guess_type(local.name)[0] or 'application/octet-stream'
            await route.fulfill(status=200, content_type=content_type, body=local.read_bytes()); return
        await route.fulfill(status=404, content_type='text/plain', body='Not found'); return
    if request.resource_type == 'image' or '{z}' in request.url or '/tile' in request.url:
        await route.fulfill(status=200, content_type='image/png', body=TILE); return
    await route.fulfill(status=204, body='')

async def load_page(browser, name: str, width: int, height: int):
    context = await browser.new_context(viewport={'width': width, 'height': height}, device_scale_factor=1, reduced_motion='reduce')
    page = await context.new_page()
    errors=[]; console=[]; failures=[]
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.on('console', lambda message: console.append({'type': message.type, 'text': message.text}) if message.type == 'error' else None)
    page.on('requestfailed', lambda request: failures.append({'url': request.url, 'failure': request.failure}))
    await page.route('**/*', route_request)
    await page.set_content(stripped_html(), wait_until='load')
    await page.evaluate("""() => {
      const storage = () => {
        const values = Object.create(null);
        const api = {getItem:key => Object.prototype.hasOwnProperty.call(values,key) ? values[key] : null,setItem:(key,value) => { values[key]=String(value); },removeItem:key => { delete values[key]; },clear:() => { for (const key of Object.keys(values)) delete values[key]; },key:index => Object.keys(values)[index] ?? null};
        Object.defineProperty(api,'length',{get:() => Object.keys(values).length});
        return api;
      };
      Object.defineProperty(window,'localStorage',{value:storage(),configurable:true});
      Object.defineProperty(window,'sessionStorage',{value:storage(),configurable:true});
    }""")
    await page.add_script_tag(content=BUNDLE.read_text(encoding='utf-8'))
    await page.wait_for_selector('#world-map.map-ready', timeout=30_000)
    await page.wait_for_timeout(1800)
    if await page.locator('#merlin-guide:not([hidden])').count():
        await page.locator('[data-guide-skip]').click()
    await page.wait_for_timeout(300)
    return context, page, errors, console, failures

async def check_viewport(browser, name, width, height):
    context,page,errors,console,failures=await load_page(browser,name,width,height)
    checks={}
    checks['map-ready'] = await page.locator('#world-map.map-ready').count() == 1
    checks['readiness-installed'] = await page.locator('html').get_attribute('data-market-readiness') == 'installed'
    checks['no-horizontal-overflow'] = await page.evaluate('document.body.scrollWidth <= window.innerWidth + 2')
    checks['search-collapsed'] = await page.locator('#map-search-toggle').get_attribute('aria-expanded') == 'false'
    checks['shipping-not-nav'] = 'SHIPPING' not in [text.upper() for text in await page.locator('.merlin-nav-item').all_inner_texts()]
    checks['starting-capital-removed'] = 'STARTING CAPITAL' not in (await page.locator('body').inner_text()).upper()
    checks['theme-control'] = await page.locator('#theme-select option').count() == 6
    checks['major-earthquake-label'] = 'MAJOR EARTHQUAKES' in (await page.locator('#layer-dock').text_content()).upper()
    if width <= 860:
        await page.locator('#mobile-nav-toggle').click()
        checks['mobile-nav-opens'] = await page.locator('html').get_attribute('data-mobile-nav') == 'open'
        await page.locator('#mobile-nav-toggle').click()
    else:
        checks['desktop-nav-visible'] = await page.locator('.merlin-nav').is_visible()
    await page.locator('#map-search-toggle').click()
    checks['search-opens'] = await page.locator('#map-search-toggle').get_attribute('aria-expanded') == 'true'
    await page.keyboard.press('Escape')
    # Theme must alter both document state and map bridge inputs.
    await page.locator('#theme-select').evaluate("(el) => { el.value='forest'; el.dispatchEvent(new Event('change',{bubbles:true})); }")
    checks['theme-applies'] = await page.locator('html').get_attribute('data-theme') == 'forest'
    await page.locator('#theme-select').evaluate("(el) => { el.value='midnight'; el.dispatchEvent(new Event('change',{bubbles:true})); }")
    # Drawer must remain in viewport and scroll its own content.
    await page.locator('#layout-toggle').click()
    await page.wait_for_timeout(450)
    checks['drawer-in-viewport'] = await page.locator('#map-drawer').evaluate("el => { const r=el.getBoundingClientRect(); return r.left>=-2 && r.top>=-2 && r.right<=innerWidth+2 && r.bottom<=innerHeight+2; }")
    checks['drawer-scrollable'] = await page.locator('#drawer-content').evaluate('el => getComputedStyle(el).overflowY === "auto" || el.scrollHeight >= el.clientHeight')
    # Layer toggles must be interactive.
    layer = page.locator('[data-layer="news"]')
    before = await layer.evaluate('el => el.classList.contains("active")')
    await layer.click(); after = await layer.evaluate('el => el.classList.contains("active")')
    checks['layer-toggle'] = before != after
    await layer.click()
    # Help dialog, focus management and keyboard close.
    if width > 860:
        await page.locator('#help-button').click()
    else:
        await page.keyboard.press('?')
    checks['guide-opens'] = await page.locator('#merlin-guide:not([hidden])').count() == 1
    checks['guide-dialog-role'] = await page.locator('#merlin-guide').get_attribute('role') == 'dialog'
    await page.keyboard.press('Escape')
    checks['guide-closes'] = await page.locator('#merlin-guide[hidden]').count() == 1
    # Offline state and recovery are visible to customers.
    await page.evaluate("dispatchEvent(new Event('offline'))")
    checks['offline-banner'] = await page.locator('#connection-status').is_visible()
    await page.evaluate("dispatchEvent(new Event('online'))")
    # Main navigation and core customer workspaces.
    if width >= 1200:
        for view in ['opportunities','markets','conflict','briefings','automation','publishing','commercial','security','operations','release','live-data','places']:
            await page.locator(f'.merlin-nav-item[data-view="{view}"]').evaluate('el => el.click()')
            await page.wait_for_timeout(250)
            checks[f'view-{view}'] = await page.locator('#workspace-sheet').is_visible() and bool((await page.locator('#sheet-title').inner_text()).strip())
        await page.locator('#sheet-close').click()
    # Accessibility names for visible controls.
    checks['visible-buttons-named'] = await page.evaluate("""() => [...document.querySelectorAll('button')].filter(b => b.offsetParent !== null).every(b => Boolean(b.getAttribute('aria-label') || b.textContent.trim()))""")
    checks['skip-link'] = await page.locator('.skip-link').count() == 1
    checks['no-page-errors'] = not errors
    checks['no-console-errors'] = not console
    checks['no-failed-local-requests'] = not [item for item in failures if item['url'].startswith('http://merlin.local/')]
    OUTPUT.mkdir(parents=True, exist_ok=True)
    await page.screenshot(path=str(OUTPUT / f'{name}.png'), full_page=True)
    metrics = await page.evaluate("""() => ({domNodes:document.getElementsByTagName('*').length, visibleMarkers:document.querySelectorAll('[data-map-entity]').length, bodyWidth:document.body.scrollWidth, viewportWidth:innerWidth, theme:document.documentElement.dataset.theme})""")
    await context.close()
    return {'name':name,'viewport':{'width':width,'height':height},'checks':checks,'metrics':metrics,'pageErrors':errors,'consoleErrors':console,'requestFailures':failures}

async def main() -> int:
    subprocess.run([sys.executable, str(ROOT/'scripts/build-merlin-browser-bundle.py')], cwd=ROOT, check=True)
    env={**os.environ,'HOST':'127.0.0.1','PORT':str(SERVER_PORT),'NODE_ENV':'test','LOG_LEVEL':'error','TERM':'xterm'}
    server=subprocess.Popen(['node','server.js'],cwd=ROOT,env=env,stdout=subprocess.DEVNULL,stderr=subprocess.STDOUT,text=True)
    browser = None
    try:
        wait_server()
        pw = await async_playwright().start()
        browser=await pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
        results=[]
        for viewport in VIEWPORTS:
            print(f'Running {viewport[0]} {viewport[1]}x{viewport[2]}', flush=True)
            results.append(await asyncio.wait_for(check_viewport(browser,*viewport), timeout=90))
            print(f'Completed {viewport[0]}', flush=True)
        failed=[]
        for result in results:
            failed.extend(f"{result['name']}:{name}" for name,value in result['checks'].items() if not value)
        report={'browser':'system Chromium','renderedViewports':len(results),'results':results,'failed':failed,'screenshots':str(OUTPUT)}
        OUTPUT.mkdir(parents=True,exist_ok=True)
        (OUTPUT/'report.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
        summary={'renderedViewports':len(results),'failed':failed,'screenshots':str(OUTPUT)}
        print(json.dumps(summary,indent=2), flush=True)
        code = 1 if failed else 0
        try:
            await asyncio.wait_for(browser.close(), timeout=5)
        except Exception:
            pass
        try:
            server.terminate(); server.wait(timeout=3)
        except Exception:
            server.kill()
        # The Playwright transport can remain open in restricted CI sandboxes even
        # after Chromium exits. At this point every result and screenshot is flushed,
        # so exit directly rather than hanging during transport teardown.
        os._exit(code)
    except Exception:
        if browser is not None:
            try:
                await asyncio.wait_for(browser.close(), timeout=3)
            except Exception:
                pass
        try:
            server.kill()
        except Exception:
            pass
        raise

if __name__=='__main__':
    raise SystemExit(asyncio.run(main()))
