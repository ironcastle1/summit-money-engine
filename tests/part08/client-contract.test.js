import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('hazard analysis modules remain internal while earthquake content is removed from customers', async () => {
  const [bootstrap, html, client] = await Promise.all([
    readFile(new URL('../../public/hazards/bootstrap.js', import.meta.url), 'utf8'),
    readFile(new URL('../../public/index.html', import.meta.url), 'utf8'),
    readFile(new URL('../../public/merlin-v23.js', import.meta.url), 'utf8')
  ]);
  assert.match(bootstrap, /HAZARDS/);
  assert.doesNotMatch(html, /data-view="hazards"|earthquake/i);
  assert.match(client, /EARTHQUAKE_RE/);
});
