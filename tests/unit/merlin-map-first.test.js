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
  assert.match(html, /SHIPPING MONEY/);
  assert.doesNotMatch(html, /data-view="news"/);
  assert.doesNotMatch(html, /sound-toggle|audio-toggle/i);
});

test('V17 uses a detailed interactive map with clickable live layers and no fixed London selection', async () => {
  const app = await read('public/merlin.js');
  assert.match(app, /new window\.maplibregl\.Map/);
  assert.match(app, /tiles\.openfreemap\.org\/styles\/liberty/);
  assert.match(app, /merlin-event-points/);
  assert.match(app, /merlin-route-lines/);
  assert.match(app, /merlin-port-points/);
  assert.match(app, /merlin-country-risk-fill/);
  assert.match(app, /map\.on\('click', 'merlin-event-points'/);
  assert.match(app, /where: playbook\.where/);
  assert.match(app, /action: playbook\.action/);
  assert.doesNotMatch(app, /selectedPlace:\s*\{[^}]*London/i);
});

test('X is registered only when configured', async () => {
  const source = await read('src/app/create-application.js');
  assert.match(source, /if \(config\.news\.xBearerToken\)/);
});
