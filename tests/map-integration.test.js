import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');

test('production pins MapLibre 6.2.0',()=>{
  const pkg=JSON.parse(read('package.json'));
  assert.equal(pkg.dependencies?.['maplibre-gl'],'6.2.0');
});

test('customer map has WebGL viewport and bundled dark-blue resilience',()=>{
  const html=read('public/index.html');
  assert.match(html,/id="glMap"/);
  assert.match(html,/id="fallbackMap"/);
  assert.match(html,/world-tech-equirect\.jpg/);
  assert.doesNotMatch(html,/world-mercator\.svg/);
  assert.doesNotMatch(html,/natural-earth-relief\.png/);
});

test('primary basemap is bundled dark-blue high-detail tile pyramid and satellite remains optional',()=>{
  const code=read('public/modules/map.js');
  assert.match(code,/\/assets\/tech-map\/\{z\}\/\{x\}\/\{y\}\.jpg/);
  assert.match(code,/World_Imagery\/MapServer\/tile/);
  assert.match(code,/tech-base-lines\.json/);
  assert.match(code,/merlin-tech-grid/);
  assert.ok(fs.existsSync(path.join(root,'public/assets/tech-map/0/0/0.jpg')));
  assert.ok(fs.existsSync(path.join(root,'public/assets/tech-map/3/7/7.jpg')));
  assert.ok(fs.existsSync(path.join(root,'public/data/tech-base-lines.json')));
});

test('signals routes ports nodes city lights and alert rings use native GeoJSON map layers',()=>{
  const code=read('public/modules/map-renderer.js');
  for(const id of [
    'merlin-events-core','merlin-events-heat','merlin-air-alert-ring','merlin-routes-line',
    'merlin-ports-core','merlin-nodes-core','merlin-city-glow'
  ]) assert.match(code,new RegExp(id));
  assert.match(code,/type:\s*'geojson'/);
  assert.match(code,/syncFallback/);
  assert.match(code,/fb-marker/);
});

test('customer exposes focused toggleable overlay controls',()=>{
  const html=read('public/index.html');
  for(const layer of ['conflict','politics','sanctions','shipping','energy','cyber','market','supply','alerts','heatmap','nodes','ports','routes','labels']) {
    assert.match(html,new RegExp(`data-layer="${layer}"`));
  }
  assert.match(html,/DARK BLUE/);
  assert.match(html,/SATELLITE/);
});

test('deployment CSP permits satellite provider and local map resources',()=>{
  const server=read('server.js');
  assert.match(server,/server\.arcgisonline\.com/);
  assert.match(server,/worker-src 'self' blob:/);
  assert.match(server,/\.jpg/);
  assert.match(server,/image\/jpeg/);
});
