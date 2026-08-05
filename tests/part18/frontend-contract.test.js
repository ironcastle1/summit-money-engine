import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
test('release workspace is wired into primary navigation', async () => { const html = await readFile(new URL('../../public/index.html', import.meta.url), 'utf8'); assert.match(html, /data-view="release"/); assert.match(html, /release-v20\.css\?v=20\.18\.0/); assert.doesNotMatch(html, /data-view="shipping"/); });
test('client bootstrap installs release controller', async () => { const source = await readFile(new URL('../../public/merlin.js', import.meta.url), 'utf8'); assert.match(source, /installReleaseSystem/); assert.match(source, /view === 'release'/); });
