import { BaseNewsSource } from './base-news-source.js';
import { createArticle } from '../domain/news/article-schema.js';

const DEFAULT_QUERY = '(breaking OR markets OR conflict OR earthquake OR shipping OR energy) -is:retweet lang:en';

export class XSocialSource extends BaseNewsSource {
  constructor(options) {
    const token = String(options.bearerToken || '').trim();
    super({ id: 'x', name: 'X Recent Search', kind: 'SOCIAL', weight: 0.65, configured: Boolean(token), ...options });
    this.bearerToken = token;
    this.baseUrl = options.baseUrl || 'https://api.x.com/2/tweets/search/recent';
  }

  async fetchArticles(options = {}) {
    const query = String(options.query || DEFAULT_QUERY).trim().slice(0, 512);
    const limit = Math.max(10, Math.min(100, Number(options.limit || 50)));
    const url = new URL(this.baseUrl);
    url.searchParams.set('query', query);
    url.searchParams.set('max_results', String(limit));
    url.searchParams.set('tweet.fields', 'created_at,public_metrics,lang,author_id,entities');
    url.searchParams.set('expansions', 'author_id');
    url.searchParams.set('user.fields', 'name,username,verified,public_metrics');
    const payload = await this.http.json(url, { upstream: this.id, attempts: 1, timeoutMs: 12_000, headers: { authorization: `Bearer ${this.bearerToken}` } });
    const users = new Map((payload.includes?.users || []).map(user => [user.id, user]));
    return (payload.data || []).flatMap(post => {
      const user = users.get(post.author_id) || {};
      const metrics = post.public_metrics || {};
      const article = createArticle({
        externalId: post.id,
        title: post.text,
        summary: post.text,
        url: user.username ? `https://x.com/${user.username}/status/${post.id}` : `https://x.com/i/web/status/${post.id}`,
        sourceName: user.name || user.username || 'X',
        sourceDomain: 'x.com',
        sourceType: 'SOCIAL',
        author: user.username,
        language: post.lang,
        publishedAt: post.created_at,
        engagement: { likes: metrics.like_count, reposts: metrics.retweet_count, replies: metrics.reply_count, quotes: metrics.quote_count, views: metrics.impression_count },
        metadata: { verified: Boolean(user.verified), followers: user.public_metrics?.followers_count || 0, authorId: post.author_id }
      });
      return article ? [article] : [];
    });
  }
}
