import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const read = path => readFile(new URL(`../../${path}`, import.meta.url), 'utf8');

test('operations administration is hidden from paying customers', async () => {
  const index = await read('public/index.html');
  assert.doesNotMatch(index, /data-view="operations"|reliability-v20\.css/);
});
test('operations modules remain available for service owners', async () => {
  const [controller, incident, recovery, deployment] = await Promise.all([read('public/reliability/controller.js'), read('public/reliability/incident-panel.js'), read('public/reliability/recovery-panel.js'), read('public/reliability/deployment-panel.js')]);
  assert.match(incident, /DECLARE INCIDENT/);
  assert.match(recovery, /RESTORE EVIDENCE/);
  assert.match(deployment, /RELEASE CONTROL/);
  assert.doesNotMatch(controller + incident + recovery + deployment, /TODO|placeholder|coming soon/i);
});
