import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('Publishing workspace is linked in main navigation', async () => { const html = await readFile(new URL('../../public/index.html', import.meta.url), 'utf8'); assert.match(html, /data-view="publishing"/); assert.match(html, /publishing-v20\.css\?v=20\.14\.0/); });
test('main client installs Publishing system', async () => { const source = await readFile(new URL('../../public/merlin.js', import.meta.url), 'utf8'); assert.match(source, /installPublishingSystem/); assert.match(source, /publishingSystem\.activate/); });
test('Publishing controller exposes generation and delivery actions', async () => { const source = await readFile(new URL('../../public/publishing/controller.js', import.meta.url), 'utf8'); assert.match(source, /generate-edition/); assert.match(source, /deliver-edition/); assert.match(source, /preview-edition/); });
