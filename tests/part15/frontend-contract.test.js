import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('commercial administration stays behind the product instead of cluttering customer navigation', async () => {
  const html = await readFile(new URL('../../public/index.html', import.meta.url), 'utf8');
  assert.doesNotMatch(html, /data-view="commercial"|commercial-v20\.css/);
});
test('commercial controller retains tenant, support and feature actions', async () => {
  const source = await readFile(new URL('../../public/commercial/controller.js', import.meta.url), 'utf8');
  assert.match(source, /new-tenant/);
  assert.match(source, /new-support/);
  assert.match(source, /new-feature/);
});
