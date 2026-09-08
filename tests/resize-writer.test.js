import test from 'node:test';
import assert from 'node:assert/strict';
import { resizeDxfBuffer } from '../src/dxf/resize.js';

const source=`0\nSECTION\n2\nHEADER\n9\n$INSUNITS\n70\n4\n0\nENDSEC\n0\nSECTION\n2\nENTITIES\n0\nLWPOLYLINE\n100\nAcDbEntity\n8\n0\n100\nAcDbPolyline\n90\n4\n70\n1\n10\n0\n20\n0\n10\n100\n20\n0\n10\n100\n20\n200\n10\n0\n20\n200\n0\nENDSEC\n0\nEOF\n`;

test('resizer emits R2000 subclass markers for LWPOLYLINE',()=>{
  const machine={working_width_mm:500,working_height_mm:500,rules_json:'{}'};
  const r=resizeDxfBuffer({buffer:Buffer.from(source),originalname:'test.dxf',machine,targetHeightMm:480});
  const text=r.buffer.toString('utf8');
  assert.match(text,/0\nLWPOLYLINE\n100\nAcDbEntity\n8\n0\n100\nAcDbPolyline/);
  assert.ok(Math.abs(r.output.height_mm-480)<0.01);
  assert.ok(Math.abs(r.output.width_mm-240)<0.01);
});
