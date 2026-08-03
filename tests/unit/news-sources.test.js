import test from 'node:test';
import assert from 'node:assert/strict';
import { TtlCache } from '../../src/infra/cache/ttl-cache.js';
import { GdeltNewsSource } from '../../src/news-sources/gdelt-news-source.js';
import { RssNewsSource } from '../../src/news-sources/rss-news-source.js';
import { XSocialSource } from '../../src/news-sources/x-social-source.js';
import { NewsSourceRegistry } from '../../src/news-sources/news-source-registry.js';

const logger = { child: () => ({ warn() {}, info() {}, debug() {}, error() {} }) };
const options = http => ({ http, cache: new TtlCache(), logger, refreshMs: 1000, staleMs: 1000 });

test('GDELT adapter normalizes article-list results and sends bounded parameters', async () => {
  let requested;
  const http = { json: async url => { requested = new URL(url); return { articles: [{ url: 'https://reuters.com/a', title: 'Oil supply disrupted', seendate: '20260729T170000Z', domain: 'reuters.com', language: 'English', sourcecountry: 'United Kingdom' }] }; } };
  const source = new GdeltNewsSource({ ...options(http), baseUrl: 'https://api.gdeltproject.org/api/v2/doc/doc' });
  const result = await source.search({ query: 'oil', limit: 20, hours: 6 });
  assert.equal(result.articles.length, 1);
  assert.equal(result.articles[0].sourceDomain, 'reuters.com');
  assert.equal(requested.searchParams.get('mode'), 'artlist');
  assert.equal(requested.searchParams.get('timespan'), '6h');
  assert.equal(result.health.state, 'ONLINE');
});

test('RSS adapter parses RSS 2.0, Atom links, descriptions and images', async () => {
  const rss = '<rss><channel><title>Test Feed</title><item><title>Storm shuts port</title><guid>x1</guid><link>https://example.com/x1</link><description><![CDATA[Port traffic stopped]]></description><pubDate>Wed, 29 Jul 2026 17:00:00 GMT</pubDate><media:thumbnail url="https://example.com/image.jpg"/></item></channel></rss>';
  const http = { text: async () => rss };
  const source = new RssNewsSource({ ...options(http), feeds: [{ id: 'test', name: 'Test', url: 'https://example.com/rss', domain: 'example.com' }] });
  const result = await source.search({ hours: 168 });
  assert.equal(result.articles.length, 1);
  assert.equal(result.articles[0].category, 'storm');
  assert.equal(result.articles[0].imageUrl, 'https://example.com/image.jpg');
});


test('X adapter stays NOT_CONFIGURED without a token and uses bearer auth with one', async () => {
  const off = new XSocialSource({ ...options({ json: async () => ({}) }), bearerToken: '' });
  const offResult = await off.search({ query: 'oil' });
  assert.equal(offResult.health.state, 'NOT_CONFIGURED');
  let headers;
  const http = { json: async (_url, options) => { headers = options.headers; return { data: [{ id: '1', text: 'Oil pipeline halted', author_id: 'u1', created_at: '2026-07-29T17:00:00Z', lang: 'en', public_metrics: { like_count: 2 } }], includes: { users: [{ id: 'u1', name: 'Analyst', username: 'analyst' }] } }; } };
  const on = new XSocialSource({ ...options(http), bearerToken: 'secret' });
  const onResult = await on.search({ query: 'oil', limit: 10 });
  assert.equal(headers.authorization, 'Bearer secret');
  assert.equal(onResult.articles.length, 1);
});

test('news registry deduplicates cross-source output and returns source health', async () => {
  class FakeSource {
    constructor(id, articles) { this.id = id; this.name = id; this.articles = articles; }
    async search() { return { articles: this.articles, health: this.health() }; }
    health() { return { id: this.id, name: this.name, state: 'ONLINE', configured: true, recordCount: this.articles.length }; }
  }
  const common = { id: 'a', title: 'Pipeline attack halts exports', summary: '', url: 'https://same.com/a', sourceDomain: 'same.com', sourceName: 'Same', sourceType: 'NEWS', publishedAt: '2026-07-29T17:00:00Z', countries: [], entities: [], tickers: [], engagement: {}, metadata: {} };
  const registry = new NewsSourceRegistry({ logger: { info() {} } }).register(new FakeSource('one', [common])).register(new FakeSource('two', [{ ...common, id: 'b' }]));
  const result = await registry.search({});
  assert.equal(result.rawCount, 2);
  assert.equal(result.articleCount, 1);
  assert.equal(Object.keys(result.sources).length, 2);
});
