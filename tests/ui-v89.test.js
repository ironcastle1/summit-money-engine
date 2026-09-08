import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('Image to DXF exposes line-art rescue mode',()=>{
  const html=fs.readFileSync(new URL('../public/index.html',import.meta.url),'utf8');
  const app=fs.readFileSync(new URL('../public/app.js',import.meta.url),'utf8');
  const src=fs.readFileSync(new URL('../public/image-dxf.js',import.meta.url),'utf8');
  assert.match(html,/value="lineart">Line drawing \/ separated details/);
  assert.match(app,/image-conversion-mode/);
  assert.match(src,/function bridgeComponents\(/);
  assert.match(src,/function localContrastMask\(/);
  assert.match(src,/connectivity rescue/);
  assert.match(src,/bold-3/);
  assert.match(src,/bridges_added/);
});

test('No fixing holes remains the default resizer behaviour',()=>{
  const html=fs.readFileSync(new URL('../public/index.html',import.meta.url),'utf8');
  assert.match(html,/value="0" selected>No fixing holes/);
});
