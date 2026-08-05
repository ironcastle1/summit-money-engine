import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
test('market workspace imports and installs the intelligence controller', async () => {
  const source = await readFile(new URL('../../public/merlin.js', import.meta.url), 'utf8');
  assert.match(source, /installMarketIntelligenceSystem/);
  assert.match(source, /marketIntelligenceSystem\.activate/);
});
test('market client exposes heatmap screener detail watchlist and scenario modules', async () => {
  for (const file of ['heatmap.js', 'screener-table.js', 'detail-panel.js', 'watchlist-panel.js', 'scenario-panel.js', 'market-layer.js']) {
    const info = await stat(new URL(`../../public/market-intelligence/${file}`, import.meta.url));
    assert.equal(info.isFile(), true);
  }
});
test('market stylesheet is linked by the application shell', async () => {
  const html = await readFile(new URL('../../public/index.html', import.meta.url), 'utf8');
  assert.match(html, /market-intelligence-v20\.css/);
});
