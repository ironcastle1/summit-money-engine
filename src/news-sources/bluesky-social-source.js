import { BaseNewsSource } from './base-news-source.js';
import { createArticle } from '../domain/news/article-schema.js';

const DEFAULT_QUERY = 'breaking OR markets OR conflict OR earthquake OR shipping OR energy';

function postUrl(post) {
  const uri = String(post.uri || '');
  const match = uri.match(/^at:\/\/([^/]+)\/app\.bsky\.feed\.post\/([^/]+)$/);
  return match ? `https://bsky.app/profile/${match[1]}/post/${match[2]}` : null;
}

export class BlueskySocialSource extends BaseNewsSource {
  constructor(options) {
    super({ id: 'bluesky', name: 'Bluesky Search', kind: 'SOCIAL', weight: 0.65, ...options });
    this.baseUrl = options.baseUrl || 'https://public.api.bsky.app/xrpc/app.bsky.feed.searchPosts';
  }

  async fetchArticles(options = {}) {
    const query = String(options.query || DEFAULT_QUERY).trim().slice(0, 240);
    const limit = Math.max(10, Math.min(100, Number(options.limit || 50)));
    const url = new URL(this.baseUrl);
    url.searchParams.set('q', query);
    url.searchParams.set('limit', String(limit));
    url.searchParams.set('sort', options.sort === 'relevance' ? 'top' : 'latest');
    const payload = await this.http.json(url, { upstream: this.id, attempts: 2, timeoutMs: 12_000 });
    return (payload.posts || []).flatMap(post => {
      const record = post.record || {};
      const text = String(record.text || '').trim();
      if (!text) return [];
      const author = post.author || {};
      const article = createArticle({
        externalId: post.uri,
        title: text.slice(0, 180),
        summary: text,
        url: postUrl(post),
        sourceName: author.displayName || author.handle || 'Bluesky',
        sourceDomain: 'bsky.app',
        sourceType: 'SOCIAL',
        author: author.handle,
        publishedAt: record.createdAt || post.indexedAt,
        engagement: { likes: post.likeCount, reposts: post.repostCount, replies: post.replyCount, quotes: post.quoteCount },
        metadata: { did: author.did || null, handle: author.handle || null, labels: post.labels || [] }
      });
      return article ? [article] : [];
    });
  }
}
