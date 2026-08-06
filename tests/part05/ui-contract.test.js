import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const root = new URL('../../', import.meta.url);
test('main interface uses compact search, current-only layers and customer navigation', async () => {
  const html = await readFile(new URL('public/index.html', root), 'utf8');
  assert.match(html, /id="search-toggle"/);
  assert.match(html, /src="\/merlin-v24\.js\?v=24\.1\.0"/);
  assert.match(html, />Current events</);
  assert.match(html, />Latest reporting</);
  assert.match(html, />English place labels</);
  assert.doesNotMatch(html, /earthquake/i);
  assert.doesNotMatch(html, /data-view="shipping"/);
  assert.doesNotMatch(html, /theme-select|data-view="operations"|data-view="security"/i);
});
test('customer panels and detail drawers are independently scrollable', async () => {
  const css = await readFile(new URL('public/css/merlin-v24.css', root), 'utf8');
  assert.match(css, /\.feed-list[\s\S]*overflow-y:\s*auto/);
  assert.match(css, /\.detail-body[\s\S]*overflow-y:\s*auto/);
  assert.match(css, /\.workspace-content[\s\S]*overflow-y:\s*auto/);
});
test('map engine uses direct tiles, bounded viewport and gentle gesture controls', async () => {
  const source = await readFile(new URL('public/map-v20/map-engine.js', root), 'utf8');
  const tiles = await readFile(new URL('public/map-v20/tile-source.js', root), 'utf8');
  const gestures = await readFile(new URL('public/map-v20/gesture-controller.js', root), 'utf8');
  assert.match(source, /class MapEngineV20/);
  const viewport = await readFile(new URL('public/map-v20/viewport-model.js', root), 'utf8');
  assert.match(viewport, /clampViewport/);
  assert.match(tiles, /basemaps\.cartocdn\.com/);
  assert.match(gestures, /wheelAccumulator/);
  assert.match(gestures, /minimumInterval/);
});
