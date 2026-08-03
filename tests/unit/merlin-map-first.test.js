import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = path => readFile(new URL(`../../${path}`, import.meta.url), 'utf8');

test('V17 is map-first and merges news into toggleable map intelligence', async () => {
  const html = await read('public/index.html');
  assert.match(html, /id="world-map"/);
  assert.match(html, /data-layer="news"/);
  assert.match(html, /data-layer="routes"/);
  assert.match(html, /data-layer="countryRisk"/);
  assert.match(html, /data-view="shipping"/);
  assert.doesNotMatch(html, /data-view="news"/);
  assert.doesNotMatch(html, /sound-toggle|audio-toggle/i);
});

test('V18 uses an immediate interactive tile map with clickable local layers and no fixed London selection', async () => {
  const app = await read('public/merlin.js');
  const map = await read('public/map/merlin-tile-map.js');
  assert.match(app, /new MerlinTileMap/);
  assert.match(map, /tile\.openstreetmap\.org/);
  assert.match(map, /pointerdown/);
  assert.match(map, /data-map-entity/);
  assert.match(map, /setLayerVisibility/);
  assert.match(app, /where: playbook\.where/);
  assert.match(app, /action: playbook\.action/);
  assert.doesNotMatch(app, /selectedPlace:\s*\{[^}]*London/i);
});

test('X is registered only when configured', async () => {
  const source = await read('src/app/create-application.js');
  assert.match(source, /if \(config\.news\.xBearerToken\)/);
});
