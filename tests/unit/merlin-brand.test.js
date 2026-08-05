import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
const read = path => readFile(new URL(`../../${path}`, import.meta.url), 'utf8');
test('Merlin identity is applied to the application shell and PWA', async () => {
    const html = await read('public/index.html');
    const manifest = JSON.parse(await read('public/manifest.webmanifest'));
    assert.match(html, /MERLIN/);
    assert.match(html, /merlin-logo-inverted\.png/);
    assert.match(html, /type="module" src="\/merlin\.js\?v=20\.20\.1"/);
    assert.doesNotMatch(html, /MONEY MAP|GLOBAL INTELLIGENCE/);
    assert.equal(manifest.name, 'Merlin');
    assert.equal(manifest.short_name, 'Merlin');
    await access(new URL('../../public/assets/merlin-logo-master.png', import.meta.url));
    await access(new URL('../../public/icons/merlin-512.png', import.meta.url));
});
