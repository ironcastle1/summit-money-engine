import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const root = new URL('../../', import.meta.url);
test('main interface uses compact map search and removes standalone shipping navigation', async () => {
    const html = await readFile(new URL('public/index.html', root), 'utf8');
    assert.match(html, /id="map-search-toggle"/);
    assert.match(html, /src="\/merlin\.bundle\.js\?v=22\.0\.0" defer/);
    assert.doesNotMatch(html, /data-view="shipping"/);
    assert.match(html, />Major earthquakes</);
    assert.match(html, />English \/ local labels</);
});
test('map CSS guarantees scrollable drawers and compact closed search', async () => {
    const css = await readFile(new URL('public/css/map-v20.css', root), 'utf8');
    assert.match(css, /\.map-search\s*\{[\s\S]*width:\s*50px/);
    assert.match(css, /\.map-drawer \.drawer-content[\s\S]*overflow-y:\s*auto/);
    assert.match(css, /\.merlin-v20-map[\s\S]*overflow:\s*hidden/);
});
test('map engine contains a material-only earthquake gate and bounded-world status', async () => {
    const source = await readFile(new URL('public/map-v20/map-engine.js', root), 'utf8');
    assert.match(source, /function materialEarthquake/);
    assert.match(source, /magnitude >= 6/);
    assert.match(source, /BOUNDED WORLD/);
    assert.match(source, /nameLocal/);
});
