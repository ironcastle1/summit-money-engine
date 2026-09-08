import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('DXF resizer has explicit no-fixing-holes mode',()=>{
  const html=fs.readFileSync(new URL('../public/index.html',import.meta.url),'utf8');
  const app=fs.readFileSync(new URL('../public/app.js',import.meta.url),'utf8');
  assert.match(html,/value="0" selected>No fixing holes</);
  assert.doesNotMatch(html,/resize-dxf-add-holes/);
  assert.match(app,/holeCount=Number\(\$\('#resize-dxf-hole-count'\)/);
});

test('Image to DXF includes automatic fallback segmentation and R12 output',()=>{
  const src=fs.readFileSync(new URL('../public/image-dxf.js',import.meta.url),'utf8');
  assert.match(src,/function otsu\(/);
  assert.match(src,/borderDifferenceMask/);
  assert.match(src,/closed-4/);
  assert.match(src,/AC1009/);
  assert.match(src,/POLYLINE/);
});
