const SCRIPT_URLS = Object.freeze([
  '/vendor/maplibre-gl.js',
  'https://unpkg.com/maplibre-gl@5.6.0/dist/maplibre-gl.js',
  'https://cdn.jsdelivr.net/npm/maplibre-gl@5.6.0/dist/maplibre-gl.js'
]);

const STYLE_URLS = Object.freeze([
  '/vendor/maplibre-gl.css',
  'https://unpkg.com/maplibre-gl@5.6.0/dist/maplibre-gl.css',
  'https://cdn.jsdelivr.net/npm/maplibre-gl@5.6.0/dist/maplibre-gl.css'
]);

function addStylesheet(url) {
  if ([...document.styleSheets].some(sheet => sheet.href === url)) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = url;
  link.crossOrigin = 'anonymous';
  document.head.appendChild(link);
}

function loadScript(url, timeoutMs) {
  return new Promise((resolve, reject) => {
    const existing = [...document.scripts].find(script => script.src === url);
    if (existing?.dataset.loaded === 'true') { resolve(); return; }
    const script = existing || document.createElement('script');
    const timeout = setTimeout(() => reject(new Error(`Map library timed out: ${url}`)), timeoutMs);
    script.src = url;
    script.async = true;
    script.crossOrigin = 'anonymous';
    script.addEventListener('load', () => {
      clearTimeout(timeout);
      script.dataset.loaded = 'true';
      resolve();
    }, { once: true });
    script.addEventListener('error', () => {
      clearTimeout(timeout);
      reject(new Error(`Map library failed: ${url}`));
    }, { once: true });
    if (!existing) document.head.appendChild(script);
  });
}

export async function ensureMapLibre({ timeoutMs = 8_000 } = {}) {
  if (globalThis.maplibregl?.Map) return { available: true, source: 'existing' };
  for (let index = 0; index < SCRIPT_URLS.length; index += 1) {
    try {
      addStylesheet(STYLE_URLS[index]);
      await loadScript(SCRIPT_URLS[index], timeoutMs);
      if (globalThis.maplibregl?.Map) return { available: true, source: SCRIPT_URLS[index] };
    } catch {}
  }
  return { available: false, source: null };
}
