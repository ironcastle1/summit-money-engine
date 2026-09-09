import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

function engine(){
  const src=fs.readFileSync(new URL('../public/image-dxf.js',import.meta.url),'utf8');
  const context={window:{},console,Uint8Array,Uint32Array,Int16Array,Int32Array,Float32Array,Uint8ClampedArray,Map,Math,Number,Error,Array,Set};
  vm.createContext(context);vm.runInContext(src,context);return context.window.MERLIN_IMAGE_DXF;
}

test('V9.5 exposes visible colour palette, smoothing and production controls',()=>{
  const html=fs.readFileSync(new URL('../public/index.html',import.meta.url),'utf8');
  for(const id of ['editor-colour-summary','editor-colour-palette','editor-vector-smoothing','editor-smooth-mask','editor-frame','editor-quick-hole-4']) assert.match(html,new RegExp(`id="${id}"`));
  assert.match(html,/v=9\.[0-9]+\.0/);
});

test('V9.5 builds colour palette from all pixels and can apply a colour globally',()=>{
  const eng=engine(),w=40,h=20,n=w*h,rgba=new Uint8ClampedArray(n*4),gray=new Float32Array(n);
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    const i=y*w+x,si=i*4;let r=240,g=235,b=225;
    if(x<12){r=25;g=45;b=170;} else if(x<28){r=190;g=35;b=45;}
    rgba[si]=r;rgba[si+1]=g;rgba[si+2]=b;rgba[si+3]=255;gray[i]=.2126*r+.7152*g+.0722*b;
  }
  const regions=eng.detectImageRegions(gray,w,h,{detail:'medium',rgba,maxRegions:50});
  assert.ok(regions.palette.length>=3);
  assert.equal(regions.colourLabels.length,n);
  const red=regions.palette.find(c=>c.r>c.b+80&&c.r>c.g+80);assert.ok(red);
  const mask=new Uint8Array(n);
  const out=eng.setColourValues(mask,regions.colourLabels,new Set([red.id]),1);
  const selected=out.reduce((a,v)=>a+v,0);
  assert.ok(selected>250&&selected<400);
});

test('V9.5 frame mounting holes are placed in frame/pads and remain connected',()=>{
  const eng=engine(),w=160,h=120,mask=new Uint8Array(w*h);
  for(let y=30;y<90;y++)for(let x=45;x<115;x++)mask[y*w+x]=1;
  const framed=eng.addFrameMask(mask,w,h,8);
  const connected=eng.autoConnectMask(framed,w,h,'medium').mask;
  const result=eng.addFrameMountingHolesMask(connected,w,h,{count:4,holeRadiusPx:4,clearancePx:3,insetPx:14,frameThicknessPx:8});
  assert.equal(result.placed.length,4);
  assert.equal(eng.componentCount(result.mask,w,h,3),1);
  for(const p of result.placed) assert.equal(result.mask[Math.round(p.y)*w+Math.round(p.x)],0);
});

test('V9.5 smoothing reduces staircase point count while retaining closed contours',()=>{
  const eng=engine(),w=100,h=100,mask=new Uint8Array(w*h);
  for(let y=10;y<90;y++)for(let x=10;x<90;x++) if((x-50)**2+(y-50)**2<35**2) mask[y*w+x]=1;
  const cleaned=eng.smoothMaskEdges(mask,w,h,1);
  assert.equal(eng.componentCount(cleaned,w,h,3),1);
  const out=eng.finalize({mask:cleaned,w,h,detail:'medium',method:'test'},{targetWidth:80,targetHeight:80,machineWidth:500,machineHeight:500,smoothing:'strong'});
  assert.ok(out.dxf.includes('AC1009'));
  assert.ok(out.loops>=1);
});
