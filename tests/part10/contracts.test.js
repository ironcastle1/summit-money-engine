import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('customer countries workspace uses current activity without exposing risk-system jargon', async () => {
  const [client, html] = await Promise.all([
    readFile(new URL('../../public/merlin-v23.js', import.meta.url), 'utf8'),
    readFile(new URL('../../public/index.html', import.meta.url), 'utf8')
  ]);
  assert.match(client, /countryActivity/);
  assert.match(html, /data-view="countries"/);
  assert.doesNotMatch(html, /country-risk-v20\.css|data-view="shipping"/);
});

test('country risk routes remain registered behind the customer interface', async () => {
  const app = await readFile(new URL('../../src/app/create-application.js', import.meta.url), 'utf8');
  assert.match(app, /registerCountryRiskRoutes/);
  assert.match(app, /createCountryRiskPlatformService/);
});
