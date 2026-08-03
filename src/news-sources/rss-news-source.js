import { BaseNewsSource } from './base-news-source.js';
import { createArticle } from '../domain/news/article-schema.js';
import { decodeXml, extractItems, extractTag } from '../util/xml.js';

function atomEntries(xml) {
  return [...String(xml || '').matchAll(/<entry\b[^>]*>([\s\S]*?)<\/entry>/gi)].map(match => match[1]);
}

function atomLink(entry) {
  const alternate = entry.match(/<link\b[^>]*rel=["']alternate["'][^>]*href=["']([^"']+)["'][^>]*\/?\s*>/i);
  const any = entry.match(/<link\b[^>]*href=["']([^"']+)["'][^>]*\/?\s*>/i);
  return decodeXml(alternate?.[1] || any?.[1] || '');
}

function rssLink(item) {
  return extractTag(item, 'link') || extractTag(item, 'guid');
}

function imageFrom(item) {
  const media = item.match(/<(?:media:content|media:thumbnail)\b[^>]*url=["']([^"']+)["'][^>]*>/i);
  const enclosure = item.match(/<enclosure\b[^>]*url=["']([^"']+)["'][^>]*type=["']image\//i);
  return decodeXml(media?.[1] || enclosure?.[1] || '');
}

function feedName(xml, fallback) {
  const channel = String(xml || '').match(/<channel\b[^>]*>([\s\S]*?)<\/channel>/i)?.[1] || xml;
  return extractTag(channel, 'title') || fallback;
}

export class RssNewsSource extends BaseNewsSource {
  constructor(options) {
    super({ id: 'rss', name: 'RSS Feeds', kind: 'NEWS', weight: 1, configured: Array.isArray(options.feeds) && options.feeds.length > 0, ...options });
    this.feeds = options.feeds || [];
  }

  cacheKey(options) {
    return `${super.cacheKey(options)}:${this.feeds.map(feed => feed.url).join('|')}`;
  }

  async fetchFeed(feed, options) {
    const xml = await this.http.text(feed.url, { upstream: `${this.id}:${feed.id || feed.name}`, attempts: 2, timeoutMs: 12_000, accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml, */*' });
    const name = feed.name || feedName(xml, new URL(feed.url).hostname);
    const domain = feed.domain || new URL(feed.url).hostname.replace(/^www\./, '');
    const items = extractItems(xml);
    const entries = items.length ? items.map(item => ({ item, atom: false })) : atomEntries(xml).map(item => ({ item, atom: true }));
    const cutoff = Date.now() - Math.max(1, Math.min(168, Number(options.hours || 24))) * 3_600_000;
    return entries.flatMap(({ item, atom }) => {
      const title = extractTag(item, 'title');
      const summary = extractTag(item, atom ? 'summary' : 'description') || extractTag(item, 'content:encoded') || extractTag(item, 'content');
      const publishedAt = extractTag(item, atom ? 'published' : 'pubDate') || extractTag(item, 'updated') || extractTag(item, 'dc:date');
      const timestamp = Date.parse(publishedAt);
      if (Number.isFinite(timestamp) && timestamp < cutoff) return [];
      const article = createArticle({
        externalId: extractTag(item, 'guid') || extractTag(item, 'id'),
        title,
        summary,
        url: atom ? atomLink(item) : rssLink(item),
        imageUrl: imageFrom(item),
        sourceName: name,
        sourceDomain: domain,
        sourceType: 'NEWS',
        author: extractTag(item, 'author') || extractTag(item, 'dc:creator'),
        publishedAt: publishedAt || Date.now(),
        metadata: { feedId: feed.id || null, feedUrl: feed.url }
      });
      if (!article) return [];
      const query = String(options.query || '').trim().toLowerCase();
      const simpleQuery = /[()"]/i.test(query) || /\b(?:or|and|not)\b/i.test(query) ? '' : query;
      if (simpleQuery) {
        const haystack = `${article.title} ${article.summary}`.toLowerCase();
        const terms = simpleQuery.split(/\s+/).filter(Boolean);
        if (!terms.every(term => haystack.includes(term))) return [];
      }
      return [article];
    });
  }

  async fetchArticles(options = {}) {
    const settled = await Promise.allSettled(this.feeds.map(feed => this.fetchFeed(feed, options)));
    const articles = settled.flatMap(result => result.status === 'fulfilled' ? result.value : []);
    if (!articles.length && settled.every(result => result.status === 'rejected')) throw settled[0].reason;
    return articles.slice(0, Math.max(1, Math.min(500, Number(options.limit || 150))));
  }
}
