import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';

test('market workspace loads the simplified live market client', async () => {
  const [source, html] = await Promise.all([
    readFile(new URL('../../public/merlin-v24.js', import.meta.url), 'utf8'),
    readFile(new URL('../../public/index.html', import.meta.url), 'utf8')
  ]);
  assert.match(source, /api\/customer\/snapshot/);
  assert.match(source, /renderMarkets/);
  assert.match(html, /data-view="markets"/);
});

test('advanced market modules remain available for future paid features', async () => {
  for (const file of ['heatmap.js', 'screener-table.js', 'detail-panel.js', 'watchlist-panel.js', 'scenario-panel.js', 'market-layer.js']) {
    const info = await stat(new URL(`../../public/market-intelligence/${file}`, import.meta.url));
    assert.equal(info.isFile(), true);
  }
});

test('customer shell uses the unified stylesheet rather than stacking old market CSS', async () => {
  const html = await readFile(new URL('../../public/index.html', import.meta.url), 'utf8');
  assert.match(html, /merlin-v24\.css/);
  assert.doesNotMatch(html, /market-intelligence-v20\.css/);
});
