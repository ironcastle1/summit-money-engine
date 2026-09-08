import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('V9.3 makes metal and cut-out states visually explicit',()=>{
  const html=fs.readFileSync(new URL('../public/index.html',import.meta.url),'utf8');
  const css=fs.readFileSync(new URL('../public/styles.css',import.meta.url),'utf8');
  assert.match(html,/GREEN = steel stays/);
  assert.match(html,/RED = cut away/);
  assert.match(html,/legend-selected/);
  assert.match(css,/\.legend-metal\{background:#23df78/);
  assert.match(css,/\.legend-cut\{background:#e93b50/);
});

test('V9.3 supports whole detected-piece selection instead of brush-only editing',()=>{
  const html=fs.readFileSync(new URL('../public/index.html',import.meta.url),'utf8');
  const app=fs.readFileSync(new URL('../public/app.js',import.meta.url),'utf8');
  const engine=fs.readFileSync(new URL('../public/image-dxf.js',import.meta.url),'utf8');
  for(const id of ['editor-detect-pieces','editor-auto-assign','editor-piece-metal','editor-piece-cut','editor-select-similar','editor-clear-selection']) assert.match(html,new RegExp(`id="${id}"`));
  assert.match(app,/detectEditorPieces/);
  assert.match(app,/setSelectedPieces/);
  assert.match(engine,/detectImageRegions/);
  assert.match(engine,/snapMaskToRegions/);
  assert.match(engine,/similarRegionIds/);
});

test('V9.3 exposes prominent production feature buttons',()=>{
  const html=fs.readFileSync(new URL('../public/index.html',import.meta.url),'utf8');
  assert.match(html,/\+ Add outer frame/);
  assert.match(html,/\+ 2 top holes/);
  assert.match(html,/\+ 4 corner holes/);
});


test('V9.3 detector labels whole tonal pieces and assigns each whole region',async()=>{
  const vm=await import('node:vm');
  const src=fs.readFileSync(new URL('../public/image-dxf.js',import.meta.url),'utf8');
  const context={window:{},console,Uint8Array,Uint32Array,Int32Array,Float32Array,Uint8ClampedArray,Map,Math,Number,Error,Array,Set};
  vm.createContext(context);vm.runInContext(src,context);
  const w=40,h=24,gray=new Float32Array(w*h);gray.fill(220);
  for(let y=4;y<20;y++)for(let x=4;x<17;x++)gray[y*w+x]=35;
  for(let y=6;y<18;y++)for(let x=23;x<36;x++)gray[y*w+x]=100;
  const eng=context.window.MERLIN_IMAGE_DXF,regions=eng.detectImageRegions(gray,w,h,{detail:'high',levels:3,maxRegions:20});
  assert.ok(regions.regions.length>=3);
  const mask=new Uint8Array(w*h);for(let y=4;y<20;y++)for(let x=4;x<17;x++)mask[y*w+x]=1;
  const snapped=eng.snapMaskToRegions(mask,regions).mask;
  const leftId=eng.regionAt(regions.labels,w,h,8,8),rightId=eng.regionAt(regions.labels,w,h,28,10);
  assert.ok(leftId>0&&rightId>0&&leftId!==rightId);
  const selected=eng.setRegionValues(snapped,regions.labels,[rightId],1);
  assert.equal(selected[10*w+28],1);
});
