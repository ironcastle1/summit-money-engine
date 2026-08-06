import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('release engineering is not exposed in primary customer navigation', async () => {
  const html = await readFile(new URL('../../public/index.html', import.meta.url), 'utf8');
  assert.doesNotMatch(html, /data-view="release"|release-v20\.css/);
  assert.doesNotMatch(html, /data-view="shipping"/);
});
test('release implementation remains present behind the product', async () => {
  const source = await readFile(new URL('../../public/release/controller.js', import.meta.url), 'utf8');
  assert.match(source, /release/i);
});
