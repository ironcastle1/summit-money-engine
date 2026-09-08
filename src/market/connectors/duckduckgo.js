import * as cheerio from 'cheerio';
import { respectfulFetch } from './http.js';

function unwrap(url) {
  try {
    const u = new URL(url, 'https://duckduckgo.com');
    const uddg = u.searchParams.get('uddg');
    return uddg ? decodeURIComponent(uddg) : u.toString();
  } catch { return url; }
}

export async function searchWeb(query, limit = 8) {
  const endpoint = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
  const { text } = await respectfulFetch(endpoint, { minHostGapMs: 2200 });
  const $ = cheerio.load(text);
  const out = [];
  $('.result').each((_, el) => {
    if (out.length >= limit) return;
    const link = $(el).find('.result__a').first();
    const title = link.text().trim();
    const href = unwrap(link.attr('href') || '');
    const snippet = $(el).find('.result__snippet').text().replace(/\s+/g,' ').trim();
    if (title && /^https?:/i.test(href)) out.push({ title, url: href, snippet, evidence_type: 'web_search_result', publisher: new URL(href).hostname.replace(/^www\./,'') });
  });
  return out;
}
