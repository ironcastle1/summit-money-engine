import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = path => readFile(new URL(`../../${path}`, import.meta.url), 'utf8');

test('V20 is map-first and keeps shipping as map layers rather than a standalone workspace', async () => {
  const html = await read('public/index.html');
  assert.match(html, /id="world-map"/);
  assert.match(html, /data-layer="news"/);
  assert.match(html, /data-layer="routes"/);
  assert.match(html, /data-layer="ports"/);
  assert.match(html, /id="search-toggle"/);
  assert.doesNotMatch(html, /earthquake/i);
  assert.match(html, />English place labels</);
  assert.doesNotMatch(html, /data-view="shipping"/);
  assert.doesNotMatch(html, /data-view="news"/);
  assert.doesNotMatch(html, /sound-toggle|audio-toggle/i);
});

test('V20 uses the bounded interactive map engine with clickable entities and no fixed London selection', async () => {
  const app = await read('public/merlin-v24.js');
  const facade = await read('public/map/merlin-tile-map.js');
  const map = await read('public/map-v20/map-engine.js');
  const tiles = await read('public/map-v20/tile-source.js');
  const viewport = await read('public/map-v20/viewport-model.js');
  assert.match(app, /new MapEngineV20/);
  assert.match(facade, /MapEngineV20 as MerlinTileMap/);
  assert.match(tiles, /basemaps\.cartocdn\.com/);
  assert.match(map, /data-map-entity/);
  assert.match(map, /setLayerVisibility/);
  assert.doesNotMatch(map, /materialEarthquake/);
  assert.match(viewport, /clampViewport/);
  assert.match(viewport, /clampViewport/);
  assert.match(app, /renderOpportunities/);
  assert.match(app, /renderBriefing/);
  assert.doesNotMatch(app, /selectedPlace:\s*\{[^}]*London/i);
});

test('X is registered only when configured', async () => {
  const source = await read('src/app/create-application.js');
  assert.match(source, /if \(config\.news\.xBearerToken\)/);
});
