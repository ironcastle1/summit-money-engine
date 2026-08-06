import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
test('Customers workspace is linked in primary navigation', async () => { const html = await readFile(new URL('../../public/index.html', import.meta.url), 'utf8'); assert.match(html, /data-view="commercial"/); assert.match(html, /commercial-v20\.css\?v=20\.15\.0/); });
test('main client installs commercial operations system', async () => { const source = await readFile(new URL('../../public/merlin.js', import.meta.url), 'utf8'); assert.match(source, /installCommercialSystem/); assert.match(source, /commercialSystem\.activate/); });
test('commercial controller exposes tenant, support and feature actions', async () => { const source = await readFile(new URL('../../public/commercial/controller.js', import.meta.url), 'utf8'); assert.match(source, /new-tenant/); assert.match(source, /new-support/); assert.match(source, /new-feature/); });
