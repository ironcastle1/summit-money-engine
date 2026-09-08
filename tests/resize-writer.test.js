import test from 'node:test';
import assert from 'node:assert/strict';
import { resizeDxfBuffer } from '../src/dxf/resize.js';

const closedSource=`0\nSECTION\n2\nHEADER\n9\n$INSUNITS\n70\n4\n0\nENDSEC\n0\nSECTION\n2\nENTITIES\n0\nLWPOLYLINE\n100\nAcDbEntity\n8\n0\n100\nAcDbPolyline\n90\n4\n70\n1\n10\n0\n20\n0\n10\n100\n20\n0\n10\n100\n20\n200\n10\n0\n20\n200\n0\nENDSEC\n0\nEOF\n`;

const openSource=`0\nSECTION\n2\nHEADER\n9\n$INSUNITS\n70\n4\n0\nENDSEC\n0\nSECTION\n2\nENTITIES\n0\nLWPOLYLINE\n100\nAcDbEntity\n8\n0\n100\nAcDbPolyline\n90\n3\n70\n0\n10\n0\n20\n0\n10\n100\n20\n0\n10\n100\n20\n200\n0\nENDSEC\n0\nEOF\n`;

test('resizer emits validated AutoCAD R12 POLYLINE/VERTEX output',()=>{
  const machine={working_width_mm:500,working_height_mm:500,rules_json:'{}'};
  const r=resizeDxfBuffer({buffer:Buffer.from(closedSource),originalname:'test.dxf',machine,targetHeightMm:480});
  const text=r.buffer.toString('utf8');
  assert.match(text,/\$ACADVER\n1\nAC1009/);
  assert.match(text,/0\nPOLYLINE\n8\n0\n66\n1/);
  assert.match(text,/0\nVERTEX\n8\n0/);
  assert.match(text,/0\nSEQEND\n8\n0/);
  assert.doesNotMatch(text,/0\nLWPOLYLINE/);
  assert.equal(r.output.round_trip_validated,true);
  assert.equal(r.output.file_format,'AutoCAD R12 ASCII (AC1009)');
  assert.equal(r.output.entity_count,1);
  assert.equal(r.output.closed_path_count,1);
  assert.equal(r.output.open_path_count,0);
  assert.ok(Math.abs(r.output.height_mm-480)<0.01);
  assert.ok(Math.abs(r.output.width_mm-240)<0.01);
  assert.match(r.outputName,/_FUSION_R12\.dxf$/);
});

test('resizer preserves an open contour instead of silently closing it',()=>{
  const machine={working_width_mm:500,working_height_mm:500,rules_json:'{}'};
  const r=resizeDxfBuffer({buffer:Buffer.from(openSource),originalname:'open.dxf',machine,targetHeightMm:400});
  assert.equal(r.source.open_path_count,r.output.open_path_count);
  assert.ok(r.output.open_path_count>0);
  assert.equal(r.output.round_trip_validated,true);
});
