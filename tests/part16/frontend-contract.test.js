import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const read = path => readFile(new URL(`../../${path}`, import.meta.url), 'utf8');
test('security workspace is linked from the main shell', async () => {
    const [index, merlin] = await Promise.all([read('public/index.html'), read('public/merlin.js')]);
    assert.match(index, /data-view="security"/);
    assert.match(index, /security-v20\.css\?v=20\.16\.0/);
    assert.match(index, /merlin\.js\?v=20\.20\.0/);
    assert.match(merlin, /installSecuritySystem/);
    assert.match(merlin, /view === 'security'/);
});
test('security browser modules avoid placeholder language and expose operational panels', async () => {
    const [controller, incidents, controls] = await Promise.all([read('public/security/controller.js'), read('public/security/incident-panel.js'), read('public/security/controls-panel.js')]);
    assert.match(incidents, /DECLARE INCIDENT/);
    assert.match(controls, /ADD EVIDENCE/);
    assert.doesNotMatch(controller + incidents + controls, /TODO|placeholder|coming soon/i);
});
