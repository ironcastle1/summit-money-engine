import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const read = path => readFile(new URL(`../../${path}`, import.meta.url), 'utf8');

test('security administration is hidden from the customer product shell', async () => {
  const index = await read('public/index.html');
  assert.doesNotMatch(index, /data-view="security"|security-v20\.css/);
});
test('security browser modules remain implemented for administrators', async () => {
  const [controller, incidents, controls] = await Promise.all([read('public/security/controller.js'), read('public/security/incident-panel.js'), read('public/security/controls-panel.js')]);
  assert.match(incidents, /DECLARE INCIDENT/);
  assert.match(controls, /ADD EVIDENCE/);
  assert.doesNotMatch(controller + incidents + controls, /TODO|placeholder|coming soon/i);
});
