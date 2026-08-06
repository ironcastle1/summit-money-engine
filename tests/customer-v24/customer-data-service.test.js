import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import os from 'node:os';
import { mkdtemp } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { CustomerDataService } from '../../src/customer/customer-data-service.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const now = new Date();
const old = new Date(Date.now() - 36 * 60 * 60 * 1000);

function response(body, type = 'json') {
  return { ok: true, status: 200, async json() { return body; }, async text() { return type === 'text' ? body : JSON.stringify(body); } };
}

function rss(items) {
  return `<?xml version="1.0"?><rss><channel><title>Test World</title>${items.map(item => `<item><title>${item.title}</title><link>${item.url}</link><pubDate>${item.date.toUTCString()}</pubDate><description>${item.description || ''}</description></item>`).join('')}</channel></rss>`;
}

test('customer data snapshot is current, mapped and excludes seismic reporting', async () => {
  const fetchImpl = async input => {
    const url = String(input);
    if (url.includes('gdeltproject')) return response({ articles: [
      { title: 'Shipping closure disrupts exports from Rotterdam', url: 'https://example.test/rotterdam', domain: 'bbc.co.uk', seendate: now.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '') },
      { title: 'Strong earthquake reported in Japan', url: 'https://example.test/q', domain: 'example.test', seendate: now.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '') },
      { title: 'Old sanctions report', url: 'https://example.test/old', domain: 'example.test', seendate: old.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '') }
    ] });
    if (url.includes('coingecko')) return response({ bitcoin: { usd: 64000, usd_24h_change: 3.2, last_updated_at: Math.floor(Date.now() / 1000) } });
    if (url.includes('bbci.co.uk/news/world')) return response(rss([
      { title: 'Ukraine reports new missile attack near Kyiv', url: 'https://bbc.test/ukraine', date: now, description: 'Current conflict reporting from Ukraine.' },
      { title: 'Week old report', url: 'https://bbc.test/old', date: old, description: 'Old news.' }
    ]), 'text');
    return response(rss([]), 'text');
  };
  const temp = await mkdtemp(path.join(os.tmpdir(), 'merlin-v24-'));
  const service = await CustomerDataService.create({ rootDir: ROOT, fetchImpl, cacheFile: path.join(temp, 'snapshot.json') });
  const snapshot = await service.snapshot({ hours: 12, force: true });
  assert.equal(snapshot.version, '24.1.0');
  assert.ok(snapshot.articles.length >= 2);
  assert.ok(snapshot.articles.every(item => Date.parse(item.publishedAt) >= Date.now() - 13 * 60 * 60 * 1000));
  assert.ok(snapshot.articles.every(item => !/earthquake|aftershock|seismic|quake/i.test(`${item.title} ${item.summary}`)));
  assert.ok(snapshot.mappedArticles.some(item => item.location?.name === 'Rotterdam' || item.location?.country === 'Ukraine'));
  assert.ok(snapshot.conflicts.some(item => /Ukraine/i.test(item.title)));
  assert.ok(snapshot.opportunities.length > 0);
  assert.equal(snapshot.ports.length, 75);
  assert.equal(snapshot.routes.length, 15);
  assert.equal(snapshot.markets[0].symbol, 'BTC');
  assert.equal(snapshot.focusRegions.length, 6);
  assert.ok(snapshot.priorityCountries.length > 50);
  assert.ok(snapshot.watchAreas.length >= 12);
  assert.ok(snapshot.articles.some(item => item.focusRegionIds.includes('europe')));
  assert.ok(snapshot.focusRegions.find(region => region.id === 'middle-east').watchTopics.length > 0);
});
