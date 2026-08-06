import test from 'node:test';
import assert from 'node:assert/strict';
import {
  readFile
}
from 'node:fs/promises';
test('browser places workspace installs country risk system',async()=>{
  const merlin=await readFile(new URL('../../public/merlin.js',import.meta.url),'utf8');
  const html=await readFile(new URL('../../public/index.html',import.meta.url),'utf8');
  assert.match(merlin,/installCountryRiskSystem/);
  assert.match(html,/country-risk-v20\.css/);
  assert.doesNotMatch(html,/data-view="shipping"/);
});
test('country risk routes are registered',async()=>{
  const app=await readFile(new URL('../../src/app/create-application.js',import.meta.url),'utf8');
  assert.match(app,/registerCountryRiskRoutes/);
  assert.match(app,/createCountryRiskPlatformService/);
});
