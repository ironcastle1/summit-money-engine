import * as cheerio from 'cheerio';
import { respectfulFetch } from './http.js';

export async function searchNews(query, limit = 8) {
  const endpoint = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-GB&gl=GB&ceid=GB:en`;
  const { text } = await respectfulFetch(endpoint, { minHostGapMs: 2000 });
  const $ = cheerio.load(text, { xmlMode: true });
  const out = [];
  $('item').each((_, el) => {
    if (out.length >= limit) return;
    const title = $(el).find('title').first().text().trim();
    const url = $(el).find('link').first().text().trim();
    const published_at = $(el).find('pubDate').first().text().trim() || null;
    const source = $(el).find('source').first().text().trim() || null;
    if (title && url) out.push({ title, url, snippet: title, publisher: source, published_at, evidence_type: 'news_rss' });
  });
  return out;
}
