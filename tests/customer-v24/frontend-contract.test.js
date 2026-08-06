import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

test('V24 customer interface keeps only customer-facing workspaces', async () => {
  const html = await readFile(path.join(ROOT, 'public/index.html'), 'utf8');
  assert.match(html, /LIVE MAP/);
  assert.match(html, /OPPORTUNITIES/);
  assert.match(html, /DAILY BRIEF/);
  assert.doesNotMatch(html, />SECURITY</);
  assert.doesNotMatch(html, />OPERATIONS</);
  assert.doesNotMatch(html, />RELEASE</);
  assert.doesNotMatch(html, />AUTOMATION</);
  assert.doesNotMatch(html, /theme selector|colour change/i);
  assert.doesNotMatch(html, /earthquake/i);
  assert.match(html, /merlin-v24\.js/);
  assert.match(html, /PRIORITY OVERVIEW/);
  assert.match(html, /MIDDLE EAST/);
  assert.match(html, /UNITED STATES/);
  assert.match(html, /All countries remain available/);
});

test('V24 frontend is current-first, scrollable and uses customer snapshot API', async () => {
  const [script, css] = await Promise.all([
    readFile(path.join(ROOT, 'public/merlin-v24.js'), 'utf8'),
    readFile(path.join(ROOT, 'public/css/merlin-v24.css'), 'utf8')
  ]);
  assert.match(script, /\/api\/customer\/snapshot/);
  assert.match(script, /hours:\s*12/);
  assert.match(script, /Date\.now\(\) - state\.hours/);
  assert.match(script, /possible customer/i);
  assert.match(script, /focusRegion:\s*'priority'/);
  assert.match(script, /Strategic watch areas/i);
  assert.match(script, /priorityCountries/);
  assert.match(css, /overflow-y:\s*auto/);
  assert.match(css, /scrollbar-color/);
  assert.match(css, /radial-gradient/);
  assert.match(css, /region-overview-grid/);
  assert.match(css, /merlin-v20-label-priority/);
});
