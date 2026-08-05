import { toTimestamp } from '../../core/time.js';
import { cosineSimilarity, jaccardSimilarity, tokenSet } from './text.js';

function canonicalUrl(value) {
  if (!value) return null;
  try {
    const url = new URL(value);
    url.hash = '';
    for (const key of [...url.searchParams.keys()]) if (/^(utm_|fbclid|gclid|mc_|ref$|source$)/i.test(key)) url.searchParams.delete(key);
    return `${url.hostname.replace(/^www\./, '')}${url.pathname}`.replace(/\/$/, '');
  } catch { return null; }
}

function similarity(left, right) {
  const urlLeft = canonicalUrl(left.url);
  const urlRight = canonicalUrl(right.url);
  if (urlLeft && urlLeft === urlRight) return 1;
  const titleJaccard = jaccardSimilarity(tokenSet(left.title), tokenSet(right.title));
  const bodyCosine = cosineSimilarity(`${left.title} ${left.summary}`, `${right.title} ${right.summary}`);
  const timeHours = Math.abs(toTimestamp(left.publishedAt) - toTimestamp(right.publishedAt)) / 3_600_000;
  const timeScore = Math.max(0, 1 - timeHours / 48);
  return titleJaccard * 0.62 + bodyCosine * 0.28 + timeScore * 0.1;
}

function choose(left, right) {
  const score = article => (article.url ? 2 : 0) + article.summary.length / 500 + (article.imageUrl ? 0.5 : 0);
  return score(left) >= score(right) ? [left, right] : [right, left];
}

function merge(primary, secondary) {
  const sourceDomains = [...new Set([primary.sourceDomain, secondary.sourceDomain, ...(primary.metadata?.sourceDomains || []), ...(secondary.metadata?.sourceDomains || [])].filter(Boolean))];
  const sourceNames = [...new Set([primary.sourceName, secondary.sourceName, ...(primary.metadata?.sourceNames || []), ...(secondary.metadata?.sourceNames || [])].filter(Boolean))];
  return Object.freeze({
    ...primary,
    summary: primary.summary || secondary.summary,
    imageUrl: primary.imageUrl || secondary.imageUrl,
    countries: Object.freeze([...new Set([...primary.countries, ...secondary.countries])]),
    entities: Object.freeze([...new Set([...primary.entities, ...secondary.entities])].slice(0, 30)),
    tickers: Object.freeze([...new Set([...primary.tickers, ...secondary.tickers])]),
    metadata: Object.freeze({ ...secondary.metadata, ...primary.metadata, sourceDomains, sourceNames, duplicateCount: Number(primary.metadata?.duplicateCount || 0) + Number(secondary.metadata?.duplicateCount || 0) + 1 })
  });
}

export function deduplicateArticles(articles, options = {}) {
  const threshold = options.threshold ?? 0.72;
  const output = [];
  for (const article of [...articles].sort((a, b) => toTimestamp(b.publishedAt) - toTimestamp(a.publishedAt))) {
    const index = output.findIndex(existing => similarity(existing, article) >= threshold);
    if (index < 0) output.push(article);
    else {
      const [primary, secondary] = choose(output[index], article);
      output[index] = merge(primary, secondary);
    }
  }
  return output;
}

export { canonicalUrl, similarity as articleSimilarity };
