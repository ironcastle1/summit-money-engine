import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const root = new URL('../../', import.meta.url);
test('main interface uses compact search, current-only layers and customer navigation', async () => {
  const html = await readFile(new URL('public/index.html', root), 'utf8');
  assert.match(html, /id="map-search-toggle"/);
  assert.match(html, /src="\/merlin-v23\.js\?v=23\.0\.0"/);
  assert.match(html, />Current events</);
  assert.match(html, />Latest news</);
  assert.match(html, />English labels</);
  assert.doesNotMatch(html, /earthquake/i);
  assert.doesNotMatch(html, /data-view="shipping"/);
  assert.doesNotMatch(html, /theme-select|data-view="operations"|data-view="security"/i);
});
test('customer panels and detail drawers are independently scrollable', async () => {
  const css = await readFile(new URL('public/css/merlin-v23.css', root), 'utf8');
  assert.match(css, /\.live-feed[\s\S]*overflow(?:-y)?:\s*(?:auto|scroll)/);
  assert.match(css, /\.detail-body[\s\S]*overflow(?:-y)?:\s*(?:auto|scroll)/);
  assert.match(css, /\.scroll-area[\s\S]*overflow(?:-y)?:\s*(?:auto|scroll)/);
});
test('map engine uses direct tiles, bounded viewport and gentle gesture controls', async () => {
  const source = await readFile(new URL('public/map-v20/map-engine.js', root), 'utf8');
  const tiles = await readFile(new URL('public/map-v20/tile-source.js', root), 'utf8');
  const gestures = await readFile(new URL('public/map-v20/gesture-controller.js', root), 'utf8');
  assert.match(source, /class MapEngineV20/);
  const viewport = await readFile(new URL('public/map-v20/viewport-model.js', root), 'utf8');
  assert.match(viewport, /clampViewport/);
  assert.doesNotMatch(source, /materialEarthquake/);
  assert.match(tiles, /basemaps\.cartocdn\.com/);
  assert.match(gestures, /wheelAccumulator/);
});
