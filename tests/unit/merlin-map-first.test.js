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
  assert.match(html, /data-layer="countryRisk"/);
  assert.match(html, /id="map-search-toggle"/);
  assert.match(html, />Major earthquakes</);
  assert.match(html, />English \/ local labels</);
  assert.doesNotMatch(html, /data-view="shipping"/);
  assert.doesNotMatch(html, /data-view="news"/);
  assert.doesNotMatch(html, /sound-toggle|audio-toggle/i);
});

test('V20 uses the bounded interactive map engine with clickable entities and no fixed London selection', async () => {
  const app = await read('public/merlin.js');
  const facade = await read('public/map/merlin-tile-map.js');
  const map = await read('public/map-v20/map-engine.js');
  const tiles = await read('public/map-v20/tile-source.js');
  const viewport = await read('public/map-v20/viewport-model.js');
  assert.match(app, /new MerlinTileMap/);
  assert.match(facade, /MapEngineV20 as MerlinTileMap/);
  assert.match(tiles, /\/api\/map\/tiles\//);
  assert.match(map, /data-map-entity/);
  assert.match(map, /setLayerVisibility/);
  assert.match(map, /materialEarthquake/);
  assert.match(map, /BOUNDED WORLD/);
  assert.match(viewport, /clampViewport/);
  assert.match(app, /where: playbook\.where/);
  assert.match(app, /action: playbook\.action/);
  assert.doesNotMatch(app, /selectedPlace:\s*\{[^}]*London/i);
});

test('X is registered only when configured', async () => {
  const source = await read('src/app/create-application.js');
  assert.match(source, /if \(config\.news\.xBearerToken\)/);
});
