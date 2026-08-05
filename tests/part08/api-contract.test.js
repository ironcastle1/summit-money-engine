import test from 'node:test';
import assert from 'node:assert/strict';
import {
  readFile
}
from 'node:fs/promises';
test('hazard API exposes snapshot, scenario, exposure, portfolio and watchlist routes', async()=> {
  const source=await readFile(new URL('../../src/api/register-hazard-routes.js', import.meta.url), 'utf8');
  for(const route of ['/api/hazards/snapshot', '/api/hazards/scenario', '/api/hazards/exposure', '/api/hazards/portfolio', '/api/hazards/watchlist'])assert.match(source, new RegExp(route.replaceAll('/', '\\/')));
});
