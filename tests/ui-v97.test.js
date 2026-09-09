import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

function engine(){
  const src=fs.readFileSync(new URL('../public/image-dxf.js',import.meta.url),'utf8');
  const context={window:{},console,Uint8Array,Uint32Array,Int16Array,Int32Array,Float32Array,Uint8ClampedArray,Map,Math,Number,Error,Array,Set};
  vm.createContext(context);vm.runInContext(src,context);return context.window.MERLIN_IMAGE_DXF;
}

test('V9.7 framed design exports internal artwork contours, not frame only',()=>{
  const eng=engine(),w=140,h=110;
  let mask=new Uint8Array(w*h);
  mask=eng.addFrameMask(mask,w,h,6);
  // A retained-steel design bar connected to top/bottom frame, deliberately
  // splitting the framed interior into two large cut-out regions.
  for(let y=6;y<h-6;y++)for(let x=64;x<=75;x++)mask[y*w+x]=1;
  // Add a horizontal feature so the inner contour is clearly not a rectangle.
  for(let y=45;y<=58;y++)for(let x=35;x<=105;x++)mask[y*w+x]=1;

  const holes=eng.enclosedVoidComponents(mask,w,h,20);
  assert.ok(holes.length>=2,'test fixture should contain meaningful internal cut-outs');
  const out=eng.finalize({mask,w,h,detail:'medium',method:'v97-test'},
    {targetWidth:480,targetHeight:480,machineWidth:642,machineHeight:592,smoothing:'medium',requireInternalContours:true,frameThicknessPx:6});
  assert.ok(out.internal_contours>=2);
  assert.equal(out.export_validation.passed,true);
  assert.equal((out.dxf.match(/\n0\nPOLYLINE\n/g)||[]).length,out.loops);
});

test('V9.7 refuses an empty frame-only image export',()=>{
  const eng=engine(),w=140,h=110;
  const mask=eng.addFrameMask(new Uint8Array(w*h),w,h,6);
  assert.throws(()=>eng.finalize({mask,w,h,detail:'medium',method:'empty-frame'},
    {targetWidth:480,targetHeight:480,machineWidth:642,machineHeight:592,smoothing:'medium',requireInternalContours:true,frameThicknessPx:6}),/actual image design is missing|frame-only/i);
});

test('V9.7 no longer morphologically erases the final editor mask during export',()=>{
  const src=fs.readFileSync(new URL('../public/image-dxf.js',import.meta.url),'utf8');
  const finalizeBlock=src.slice(src.indexOf('function finalize'),src.indexOf('async function convert'));
  assert.doesNotMatch(finalizeBlock,/smoothMaskEdges\(state\.mask/);
  assert.match(finalizeBlock,/loopsFromConnectedMask\(state\.mask/);
  assert.match(finalizeBlock,/No frame-only DXF was released|frame-only DXF/);
});
