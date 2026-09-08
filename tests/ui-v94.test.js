import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

test('V9.4 exposes colour selection controls',()=>{
  const html=fs.readFileSync(new URL('../public/index.html',import.meta.url),'utf8');
  for(const id of ['editor-colour-palette','editor-colour-all','editor-colour-none','editor-colour-metal','editor-colour-cut']) assert.match(html,new RegExp(`id="${id}"`));
  assert.match(html,/Pick\/toggle colour from image/);
  assert.match(html,/Rebuild automatic connected design/);
});

test('V9.4 clusters similar RGB regions and selects all matching regions',()=>{
  const src=fs.readFileSync(new URL('../public/image-dxf.js',import.meta.url),'utf8');
  const context={window:{},console,Uint8Array,Uint32Array,Int32Array,Float32Array,Uint8ClampedArray,Map,Math,Number,Error,Array,Set};
  vm.createContext(context);vm.runInContext(src,context);
  const eng=context.window.MERLIN_IMAGE_DXF,w=30,h=18,n=w*h,gray=new Float32Array(n),rgba=new Uint8ClampedArray(n*4);
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    const i=y*w+x,si=i*4;let r=235,g=235,b=235;
    if(x<10){r=190;g=35;b=35;} else if(x<20){r=195;g=40;b=38;} else {r=35;g=55;b=190;}
    rgba[si]=r;rgba[si+1]=g;rgba[si+2]=b;rgba[si+3]=255;gray[i]=.2126*r+.7152*g+.0722*b;
  }
  const regions=eng.detectImageRegions(gray,w,h,{detail:'high',levels:3,maxRegions:20,rgba});
  assert.ok(regions.palette.length>=2);
  const red=regions.palette.find(c=>c.r>c.b+80);
  assert.ok(red);
  const ids=eng.colourRegionIds(regions,[red.id]);
  assert.ok(ids.length>=1);
  assert.ok(ids.every(id=>regions.regions.find(r=>r.id===id).meanR>regions.regions.find(r=>r.id===id).meanB));
});

test('V9.4 automatic network drops a distant island instead of requiring it to be connected',()=>{
  const src=fs.readFileSync(new URL('../public/image-dxf.js',import.meta.url),'utf8');
  const context={window:{},console,Uint8Array,Uint32Array,Int32Array,Float32Array,Uint8ClampedArray,Map,Math,Number,Error,Array,Set};
  vm.createContext(context);vm.runInContext(src,context);
  const eng=context.window.MERLIN_IMAGE_DXF,w=120,h=80,mask=new Uint8Array(w*h);
  for(let y=20;y<60;y++)for(let x=10;x<42;x++)mask[y*w+x]=1;
  for(let y=24;y<56;y++)for(let x=47;x<75;x++)mask[y*w+x]=1;
  for(let y=3;y<9;y++)for(let x=108;x<115;x++)mask[y*w+x]=1;
  const r=eng.autoBuildViableNetwork(mask,w,h,'medium');
  assert.ok(r.kept_components>=2);
  assert.ok(r.dropped_components>=1);
  assert.equal(r.mask[5*w+111],0);
  assert.equal(eng.componentCount(r.mask,w,h,3),1);
});
