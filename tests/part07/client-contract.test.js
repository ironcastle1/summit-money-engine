import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const root = new URL('../../', import.meta.url);

test('shipping remains a useful map layer while route analysis modules stay available', async () => {
  const [client, bootstrap, html] = await Promise.all([
    readFile(new URL('public/merlin-v23.js', root), 'utf8'),
    readFile(new URL('public/logistics/bootstrap.js', root), 'utf8'),
    readFile(new URL('public/index.html', root), 'utf8')
  ]);
  assert.match(bootstrap, /ROUTE EXPOSURE/);
  assert.match(client, /state\.routes/);
  assert.match(html, />Shipping routes</);
  assert.doesNotMatch(html, /data-view="shipping"/);
});
