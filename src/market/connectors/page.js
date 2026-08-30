import * as cheerio from 'cheerio';
import { respectfulFetch } from './http.js';
import { robotsAllowed } from './robots.js';

function priceFromText(text) {
  const m = String(text || '').match(/£\s?([0-9]+(?:[,.][0-9]{1,2})?)/);
  if (!m) return null;
  const n = Number(m[1].replace(',','.'));
  return Number.isFinite(n) ? n : null;
}

export async function enrichPublicPage(item) {
  try {
    if (!(await robotsAllowed(item.url))) return { ...item, page_enriched: false, enrichment_error: 'robots.txt disallows automated retrieval of this page' };
    const { text, url } = await respectfulFetch(item.url, { minHostGapMs: 1800, timeoutMs: 15000 });
    const $ = cheerio.load(text);
    const title = $('meta[property="og:title"]').attr('content') || $('title').text().trim() || item.title;
    const desc = $('meta[property="og:description"]').attr('content') || $('meta[name="description"]').attr('content') || item.snippet;
    let jsonPrice = null;
    $('script[type="application/ld+json"]').each((_, el) => {
      if (jsonPrice != null) return;
      try {
        const data = JSON.parse($(el).text());
        const nodes = Array.isArray(data) ? data : [data];
        for (const n of nodes) {
          const offers = n?.offers || n?.['@graph']?.find?.(x => x.offers)?.offers;
          const p = offers?.price ?? offers?.lowPrice;
          if (p != null && Number.isFinite(Number(p))) { jsonPrice = Number(p); break; }
        }
      } catch {}
    });
    return { ...item, url, title, snippet: String(desc || '').replace(/\s+/g,' ').trim().slice(0,700), observed_price: jsonPrice ?? priceFromText(`${title} ${desc}`), currency: (jsonPrice != null || priceFromText(`${title} ${desc}`) != null) ? 'GBP' : null, page_enriched: true };
  } catch (error) { return { ...item, page_enriched: false, enrichment_error: error.message }; }
}
