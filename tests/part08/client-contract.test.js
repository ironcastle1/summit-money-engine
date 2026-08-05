import test from 'node:test';
import assert from 'node:assert/strict';
import {
  readFile
}
from 'node:fs/promises';
test('hazard browser system is wired for map-only operation', async()=> {
  const bootstrap=await readFile(new URL('../../public/hazards/bootstrap.js', import.meta.url), 'utf8');
  const html=await readFile(new URL('../../public/index.html', import.meta.url), 'utf8');
  const app=await readFile(new URL('../../public/merlin.js', import.meta.url), 'utf8');
  assert.match(bootstrap, /HAZARDS/);
  assert.match(app, /installHazardSystem/);
  assert.match(html, /hazards-v20\.css/);
  assert.doesNotMatch(html, /data-view="hazards"/);
});
