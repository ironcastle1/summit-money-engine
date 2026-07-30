import { BaseNewsSource } from './base-news-source.js';

export class SnapshotNewsSource extends BaseNewsSource {
  constructor(options = {}) {
    super({ id: 'snapshot-news', name: 'Local news snapshot', kind: 'NEWS', weight: 0.35, refreshMs: 86_400_000, staleMs: 31_536_000_000, ...options });
    this.articles = Object.freeze([...(options.articles || [])]);
  }
  async fetchArticles(options = {}) {
    const query = String(options.query || '').trim().toLowerCase();
    const simple = /[()"]|\b(?:or|and|not)\b/i.test(query) ? '' : query;
    const filtered = simple ? this.articles.filter(article => `${article.title} ${article.summary}`.toLowerCase().includes(simple)) : this.articles;
    return filtered.slice(0, Math.max(1, Math.min(250, Number(options.limit || 100))));
  }
}
