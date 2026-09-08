import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

test('V9.1 image geometry core survives closed-loop simplification',()=>{
  const src=fs.readFileSync(new URL('../public/image-dxf.js',import.meta.url),'utf8');
  const context={window:{},console,Uint8Array,Float32Array,Map,Math,Number,Error,Array,Set};
  vm.createContext(context);
  vm.runInContext(src,context);
  const result=context.window.MERLIN_IMAGE_DXF.selfTest();
  assert.equal(result.ok,true);
  assert.ok(result.loops>=2);
});

test('V9.1 uses junction-aware boundary stitching and closed-loop RDP anchors',()=>{
  const src=fs.readFileSync(new URL('../public/image-dxf.js',import.meta.url),'utf8');
  assert.match(src,/turnRank/);
  assert.match(src,/simplifyClosedLoop/);
  assert.doesNotMatch(src,/rdp\(closed\.concat\(\[closed\[0\]\]\)/);
});

test('V9.1 cache-busts browser image converter',()=>{
  const html=fs.readFileSync(new URL('../public/index.html',import.meta.url),'utf8');
  assert.match(html,/image-dxf\.js\?v=9\.2\.0/);
  assert.match(html,/app\.js\?v=9\.2\.0/);
});

test('V9.1 checks image geometry engine before processing user images',()=>{
  const app=fs.readFileSync(new URL('../public/app.js',import.meta.url),'utf8');
  assert.match(app,/MERLIN_IMAGE_DXF\.selfTest/);
  assert.match(app,/engine version mismatch/);
});
