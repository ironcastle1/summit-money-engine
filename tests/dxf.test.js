import test from 'node:test';
import assert from 'node:assert/strict';
import { analyseDxfText } from '../src/dxf/analyse.js';

const square = `0\nSECTION\n2\nHEADER\n9\n$INSUNITS\n70\n4\n0\nENDSEC\n0\nSECTION\n2\nENTITIES\n0\nLWPOLYLINE\n90\n4\n70\n1\n10\n0\n20\n0\n10\n100\n20\n0\n10\n100\n20\n100\n10\n0\n20\n100\n0\nENDSEC\n0\nEOF\n`;

test('simple 100mm closed square is measured from DXF geometry', () => {
  const machine = { working_width_mm:642.62, working_height_mm:591.82, rules_json:JSON.stringify({min_bridge_mm:null,min_slot_mm:null,min_hole_mm:null}) };
  const a = analyseDxfText(square, machine);
  assert.ok(Math.abs(a.width_mm - 100) < 0.001);
  assert.ok(Math.abs(a.height_mm - 100) < 0.001);
  assert.equal(a.fits_machine, true);
  assert.equal(a.closed_path_count, 1);
  assert.equal(a.open_path_count, 0);
  assert.equal(a.validation_status, 'review_required');
});

const unitlessSquare = `0\nSECTION\n2\nHEADER\n0\nENDSEC\n0\nSECTION\n2\nENTITIES\n0\nLWPOLYLINE\n90\n4\n70\n1\n10\n0\n20\n0\n10\n100\n20\n0\n10\n100\n20\n100\n10\n0\n20\n100\n0\nENDSEC\n0\nEOF\n`;

test('unitless DXF never labels drawing extents as millimetres', () => {
  const machine = { working_width_mm:642.62, working_height_mm:591.82, rules_json:'{}' };
  const a = analyseDxfText(unitlessSquare, machine);
  assert.equal(a.width_mm, null);
  assert.equal(a.height_mm, null);
  assert.equal(a.drawing_width_units, 100);
  assert.equal(a.fits_machine, null);
});

test('owner unit confirmation recalculates unitless DXF deterministically', () => {
  const machine = { working_width_mm:642.62, working_height_mm:591.82, rules_json:'{}' };
  const a = analyseDxfText(unitlessSquare, machine, { unitOverride:'millimeters' });
  assert.equal(a.width_mm, 100);
  assert.equal(a.height_mm, 100);
  assert.equal(a.fits_machine, true);
});
