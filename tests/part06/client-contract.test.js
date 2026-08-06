import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';

test('advanced overlay implementation remains available without cluttering the customer shell', async () => {
  const [controller, engine, index] = await Promise.all([
    readFile('public/overlays/overlay-controller.js', 'utf8'),
    readFile('public/map-v20/map-engine.js', 'utf8'),
    readFile('public/index.html', 'utf8')
  ]);
  assert.match(controller, /OverlayViewportLoader/);
  assert.match(engine, /PolygonRenderer/);
  assert.equal((await stat('public/css/overlays.css')).isFile(), true);
  assert.doesNotMatch(index, /overlays\.css|overlay-panel/);
  assert.match(index, />Current events</);
});
