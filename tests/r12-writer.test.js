import test from 'node:test';
import assert from 'node:assert/strict';
import { buildFusionR12Dxf } from '../src/dxf/r12-writer.js';

test('Fusion R12 writer emits classic POLYLINE/VERTEX and no LWPOLYLINE',()=>{
  const entities=[{type:'LWPOLYLINE',layer:'cut',shape:true,vertices:[{x:0,y:0,bulge:1},{x:100,y:0},{x:100,y:200},{x:0,y:200}]}];
  const text=buildFusionR12Dxf(entities,{minX:0,minY:0,unitScale:1,scale:1},100,200).toString('utf8');
  assert.match(text,/\$ACADVER\n1\nAC1009/);
  assert.match(text,/0\nPOLYLINE\n8\ncut\n66\n1/);
  assert.match(text,/0\nVERTEX\n8\ncut/);
  assert.match(text,/42\n1/);
  assert.match(text,/0\nSEQEND\n8\ncut/);
  assert.doesNotMatch(text,/LWPOLYLINE/);
});

test('Fusion R12 writer converts dxf-parser ARC radians back to DXF degrees',()=>{
  const entities=[{type:'ARC',layer:'0',center:{x:10,y:10},radius:5,startAngle:Math.PI/2,endAngle:Math.PI}];
  const text=buildFusionR12Dxf(entities,{minX:0,minY:0,unitScale:1,scale:1},20,20).toString('utf8');
  assert.match(text,/50\n90\n51\n180/);
});
