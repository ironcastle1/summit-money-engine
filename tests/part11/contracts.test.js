import test from 'node:test';
import assert from 'node:assert/strict';
import {
  readFile
}
from 'node:fs/promises';
test('conflict routes and service are registered',
async () => {
  const app = await readFile(new URL('../../src/app/create-application.js',
  import.meta.url),
  'utf8');
  assert.match(app,
  /createConflictIntelligencePlatformService/);
  assert.match(app,
  /registerConflictIntelligenceRoutes/);
});
test('browser navigation installs conflict workspace',
async () => {
  const merlin = await readFile(new URL('../../public/merlin.js',
  import.meta.url),
  'utf8'),
  html = await readFile(new URL('../../public/index.html',
  import.meta.url),
  'utf8');
  assert.match(merlin,
  /installConflictIntelligenceSystem/);
  assert.match(html,
  /data-view="conflict"/);
  assert.match(html,
  /conflict-intelligence-v20\.css/);
  assert.doesNotMatch(html,
  /data-view="shipping"/);
});
