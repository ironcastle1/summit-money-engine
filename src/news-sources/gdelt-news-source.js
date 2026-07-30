import { BaseNewsSource } from './base-news-source.js';
import { createArticle } from '../domain/news/article-schema.js';

const DEFAULT_QUERY = '(conflict OR earthquake OR flood OR wildfire OR storm OR energy OR shipping OR sanctions OR election OR cyber OR inflation OR markets)';

function gdeltDate(value) {
  const text = String(value || '').trim();
  const match = text.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/);
  if (!match) return value;
  return `${match[1]}-${match[2]}-${match[3]}T${match[4]}:${match[5]}:${match[6]}Z`;
}

export class GdeltNewsSource extends BaseNewsSource {
  constructor(options) {
    super({ id: 'gdelt', name: 'GDELT DOC 2.0', kind: 'NEWS', weight: 1.2, ...options });
    this.baseUrl = options.baseUrl || 'https://api.gdeltproject.org/api/v2/doc/doc';
  }

  async fetchArticles(options = {}) {
    const query = String(options.query || DEFAULT_QUERY).trim().slice(0, 500);
    const limit = Math.max(10, Math.min(250, Number(options.limit || 100)));
    const hours = Math.max(1, Math.min(168, Number(options.hours || 24)));
    const url = new URL(this.baseUrl);
    url.searchParams.set('query', query);
    url.searchParams.set('mode', 'artlist');
    url.searchParams.set('format', 'json');
    url.searchParams.set('maxrecords', String(limit));
    url.searchParams.set('sort', options.sort === 'relevance' ? 'HybridRel' : 'DateDesc');
    url.searchParams.set('timespan', `${hours}h`);
    const payload = await this.http.json(url, { upstream: this.id, attempts: 2, timeoutMs: 15_000 });
    return (payload.articles || []).flatMap(item => {
      const article = createArticle({
        externalId: item.url,
        title: item.title,
        url: item.url,
        imageUrl: item.socialimage,
        sourceName: item.domain,
        sourceDomain: item.domain,
        sourceType: 'NEWS',
        publishedAt: gdeltDate(item.seendate),
        language: item.language,
        country: item.sourcecountry,
        metadata: { gdeltLanguage: item.language || null, gdeltSourceCountry: item.sourcecountry || null }
      });
      return article ? [article] : [];
    });
  }
}
