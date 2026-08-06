import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
const read = path => readFile(new URL(`../../${path}`, import.meta.url), 'utf8');

test('Merlin identity is reliable in the customer shell and PWA', async () => {
  const html = await read('public/index.html');
  const manifest = JSON.parse(await read('public/manifest.webmanifest'));
  assert.match(html, /<strong>MERLIN<\/strong>/);
  assert.match(html, /class="brand-mark"/);
  assert.match(html, /<svg viewBox=\"0 0 64 64\"/);
  assert.match(html, /src="\/merlin-v24\.js\?v=24\.1\.0"/);
  assert.doesNotMatch(html, /MONEY MAP|COMMAND CENTRE|OPERATOR/);
  assert.equal(manifest.name, 'Merlin');
  assert.equal(manifest.short_name, 'Merlin');
  await access(new URL('../../public/icons/merlin-512.png', import.meta.url));
  await access(new URL('../../public/assets/merlin-mark-inverted-transparent.png', import.meta.url));
});
