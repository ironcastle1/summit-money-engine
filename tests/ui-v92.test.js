import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('V9.2 includes interactive metal/cut-out CNC editor',()=>{
  const html=fs.readFileSync(new URL('../public/index.html',import.meta.url),'utf8');
  const app=fs.readFileSync(new URL('../public/app.js',import.meta.url),'utf8');
  for(const id of ['image-editor-dialog','image-editor-canvas','editor-invert','editor-connect','editor-frame','editor-quick-hole-4','image-editor-create']) assert.match(html,new RegExp(`id="${id}"`));
  assert.match(html,/Paint metal/);
  const engine=fs.readFileSync(new URL('../public/image-dxf.js',import.meta.url),'utf8');
  assert.match(engine,/CUT-READY BLOCKED/);
  assert.match(app,/Create product & download DXF/);
});

test('V9.2 exposes explicit retained-steel interpretation controls',()=>{
  const html=fs.readFileSync(new URL('../public/index.html',import.meta.url),'utf8');
  assert.match(html,/Retained steel starts from/);
  assert.match(html,/Dark areas/);
  assert.match(html,/Light areas/);
  assert.match(html,/Photo stencil \+ connected frame/);
});

test('V9.2 supports product DXF download and removal',()=>{
  const routes=fs.readFileSync(new URL('../src/routes/index.js',import.meta.url),'utf8');
  const app=fs.readFileSync(new URL('../public/app.js',import.meta.url),'utf8');
  const html=fs.readFileSync(new URL('../public/index.html',import.meta.url),'utf8');
  assert.match(routes,/\/api\/products\/:id\/dxf/);
  assert.match(routes,/app\.delete\('\/api\/products\/:id'/);
  assert.match(routes,/app\.delete\('\/api\/product-assets\/:id'/);
  assert.match(app,/Download current DXF/);
  assert.match(app,/Delete uploaded product/);
  assert.match(html,/Delete selected uploads/);
});

test('V9.2 final image export blocks disconnected retained steel',()=>{
  const src=fs.readFileSync(new URL('../public/image-dxf.js',import.meta.url),'utf8');
  assert.match(src,/retained steel has \$\{comps\.length\} disconnected pieces/);
  assert.match(src,/autoConnectMask/);
  assert.match(src,/addMountingHolesMask/);
  assert.match(src,/photoStencilCandidate/);
});
