import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
test('release documentation forbids fabricated live data', async () => { const text = await readFile(new URL('../../docs/release/PRODUCTION-ACCEPTANCE-CHECKLIST.md', import.meta.url), 'utf8'); assert.match(text, /do not substitute fabricated live records/i); });
test('final release preserves major-earthquake-only requirement', async () => { const text = await readFile(new URL('../../docs/release/PRODUCTION-ACCEPTANCE-CHECKLIST.md', import.meta.url), 'utf8'); assert.match(text, /only materially disruptive earthquakes/i); });
test('final release preserves map-only shipping requirement', async () => { const html = await readFile(new URL('../../public/index.html', import.meta.url), 'utf8'); assert.doesNotMatch(html, /data-view="shipping"/); });
