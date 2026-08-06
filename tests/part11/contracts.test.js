import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('conflict routes and service remain registered', async () => {
  const app = await readFile(new URL('../../src/app/create-application.js', import.meta.url), 'utf8');
  assert.match(app, /createConflictIntelligencePlatformService/);
  assert.match(app, /registerConflictIntelligenceRoutes/);
});

test('customer conflict page is populated from current reports using plain language', async () => {
  const [client, html] = await Promise.all([
    readFile(new URL('../../public/merlin-v24.js', import.meta.url), 'utf8'),
    readFile(new URL('../../public/index.html', import.meta.url), 'utf8')
  ]);
  assert.match(client, /renderConflicts/);
  assert.match(client, /currentArticles\(\).*conflict|snapshot\?\.conflicts/s);
  assert.match(html, /data-view="conflicts"/);
  assert.match(html, /CONFLICTS/);
  assert.doesNotMatch(html, /conflict-intelligence-v20\.css|theatre posture|operator console/i);
});
