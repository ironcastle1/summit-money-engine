import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('publishing implementation is retained without appearing in the buyer-facing menu', async () => {
  const html = await readFile(new URL('../../public/index.html', import.meta.url), 'utf8');
  assert.doesNotMatch(html, /data-view="publishing"|publishing-v20\.css/);
});
test('Publishing controller still exposes generation and delivery actions', async () => {
  const source = await readFile(new URL('../../public/publishing/controller.js', import.meta.url), 'utf8');
  assert.match(source, /generate-edition/);
  assert.match(source, /deliver-edition/);
  assert.match(source, /preview-edition/);
});
