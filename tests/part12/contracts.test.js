import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
test('server and client decision-support contracts are integrated', async () => {
  const app = await readFile(new URL('../../src/app/create-application.js', import.meta.url), 'utf8');
  const routes = await readFile(new URL('../../src/api/register-decision-support-routes.js', import.meta.url), 'utf8');
  const html = await readFile(new URL('../../public/index.html', import.meta.url), 'utf8');
  const client = await readFile(new URL('../../public/merlin.js', import.meta.url), 'utf8');
  assert.match(app, /createDecisionSupportPlatformService/);
  assert.match(app, /registerDecisionSupportRoutes/);
  assert.match(routes, /decision-support\/snapshot/);
  assert.match(html, /data-view="briefings"/);
  assert.match(html, /decision-support-v20\.css/);
  assert.match(client, /installDecisionSupportSystem/);
  assert.doesNotMatch(html, /data-view="shipping"/);
});
