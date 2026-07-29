const VERSION = '16.9.0-part-9';
const SHELL_CACHE = `summit-shell-${VERSION}`;
const RUNTIME_CACHE = `summit-runtime-${VERSION}`;
const MAP_CACHE = `summit-map-${VERSION}`;
const SHELL = [
  '/', '/index.html', '/app.js', '/css/app.css', '/css/tokens.css', '/css/layout.css', '/css/components.css', '/css/panel.css',
  '/css/map.css', '/css/markets.css', '/css/news.css', '/css/shipping.css', '/css/intelligence.css', '/css/account.css', '/css/part3.css',
  '/css/ops.css', '/css/premium.css', '/css/motion.css', '/experience/preferences.js', '/experience/sound-library.js', '/experience/sound-engine.js', '/experience/command-registry.js', '/experience/command-palette.js', '/experience/experience-controller.js', '/offline.html', '/manifest.webmanifest', '/icons/summit-icon.svg'
];
const PRIVATE_API = ['/api/auth/', '/api/account/', '/api/admin/', '/api/user-data/', '/api/billing/'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(SHELL_CACHE).then(cache => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter(name => name.startsWith('summit-') && ![SHELL_CACHE, RUNTIME_CACHE, MAP_CACHE].includes(name)).map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
  if (event.data?.type === 'CLEAR_RUNTIME') event.waitUntil(Promise.all([caches.delete(RUNTIME_CACHE), caches.delete(MAP_CACHE)]));
});

function isPrivateApi(url) { return PRIVATE_API.some(prefix => url.pathname.startsWith(prefix)); }
function isCacheableApi(url) { return url.pathname.startsWith('/api/') && !isPrivateApi(url) && !url.pathname.startsWith('/api/ops/metrics') && !url.pathname.startsWith('/api/ops/client'); }
function isStatic(request, url) { return url.origin === self.location.origin && ['script', 'style', 'image', 'font', 'manifest'].includes(request.destination); }
function isMapTile(url) { return url.hostname.endsWith('openfreemap.org'); }

async function networkFirst(request, cacheName, timeoutMs = 7000) {
  const cache = await caches.open(cacheName);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(request, { signal: controller.signal });
    if (response.ok && request.method === 'GET') cache.put(request, response.clone());
    return response;
  } catch (error) {
    const cached = await cache.match(request);
    if (cached) return cached;
    throw error;
  } finally { clearTimeout(timeout); }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const refresh = fetch(request).then(response => {
    if (response.ok) cache.put(request, response.clone());
    return response;
  }).catch(() => null);
  return cached || refresh || Response.error();
}

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request, RUNTIME_CACHE, 5000).catch(async () => (await caches.match('/offline.html')) || Response.error()));
    return;
  }
  if (isPrivateApi(url)) return;
  if (isCacheableApi(url)) {
    event.respondWith(networkFirst(request, RUNTIME_CACHE, 8000).catch(() => new Response(JSON.stringify({ error: { code: 'OFFLINE', message: 'No cached response is available' } }), { status: 503, headers: { 'content-type': 'application/json' } })));
    return;
  }
  if (isMapTile(url)) { event.respondWith(staleWhileRevalidate(request, MAP_CACHE)); return; }
  if (isStatic(request, url)) { event.respondWith(staleWhileRevalidate(request, SHELL_CACHE)); }
});
