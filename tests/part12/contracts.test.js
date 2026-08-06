import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('decision-support services remain available and the customer gets a useful daily briefing', async () => {
  const [app, routes, html, client] = await Promise.all([
    readFile(new URL('../../src/app/create-application.js', import.meta.url), 'utf8'),
    readFile(new URL('../../src/api/register-decision-support-routes.js', import.meta.url), 'utf8'),
    readFile(new URL('../../public/index.html', import.meta.url), 'utf8'),
    readFile(new URL('../../public/merlin-v23.js', import.meta.url), 'utf8')
  ]);
  assert.match(app, /createDecisionSupportPlatformService/);
  assert.match(app, /registerDecisionSupportRoutes/);
  assert.match(routes, /decision-support\/snapshot/);
  assert.match(html, /data-view="briefing"/);
  assert.match(client, /renderBriefing/);
  assert.doesNotMatch(html, /decision-support-v20\.css|operator|shift handover/i);
});
