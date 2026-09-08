import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('V9.0 exposes dedicated high contrast stencil conversion',()=>{
  const html=fs.readFileSync(new URL('../public/index.html',import.meta.url),'utf8');
  const src=fs.readFileSync(new URL('../public/image-dxf.js',import.meta.url),'utf8');
  assert.match(html,/value="stencil"/);
  assert.match(html,/High-contrast black \/ white stencil/);
  assert.match(src,/highContrastStencilCandidate/);
  assert.match(src,/contrast\.fraction<0\.90/);
  assert.match(src,/structural merge/);
  assert.match(src,/components_joined/);
});

test('V9.0 reduces tiny texture loops before DXF generation',()=>{
  const src=fs.readFileSync(new URL('../public/image-dxf.js',import.meta.url),'utf8');
  assert.match(src,/pixelArea\*0\.00007/);
  assert.match(src,/pixelArea\*0\.00018/);
});
