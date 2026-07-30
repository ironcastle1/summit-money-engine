import { stableId } from '../../core/ids.js';
import { clamp, round } from '../../core/numbers.js';
import { toIso, toTimestamp } from '../../core/time.js';
import { classifyText, extractCountries, extractEntities, extractTickers, normalizeText } from './text.js';

function compact(value, fallback = '', maximum = 500) {
  const text = String(value ?? '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  return (text || fallback).slice(0, maximum);
}

function safeUrl(value) {
  try {
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol)) return null;
    url.hash = '';
    for (const key of [...url.searchParams.keys()]) if (/^(utm_|fbclid|gclid|mc_)/i.test(key)) url.searchParams.delete(key);
    return url.toString();
  } catch { return null; }
}

function host(value) {
  try { return new URL(value).hostname.replace(/^www\./, '').toLowerCase(); } catch { return ''; }
}

export function createArticle(input, now = Date.now()) {
  const title = compact(input.title, 'Untitled', 300);
  const summary = compact(input.summary || input.description || input.text, '', 1200);
  const url = safeUrl(input.url || input.link);
  const publishedTimestamp = toTimestamp(input.publishedAt || input.time || input.date || input.createdAt) ?? now;
  const sourceName = compact(input.sourceName || input.source || host(url), 'Unknown', 100);
  const sourceDomain = compact(input.sourceDomain || input.domain || host(url), '', 120).toLowerCase();
  const externalId = compact(input.externalId || input.sourceId || input.id, '', 220);
  const id = externalId ? stableId('article', sourceName, externalId) : stableId('article', sourceDomain, normalizeText(title), Math.floor(publishedTimestamp / 300_000));
  const combined = `${title}. ${summary}`;
  const category = compact(input.category, '', 40).toLowerCase() || classifyText(combined);
  const countries = [...new Set([...(input.countries || []), ...extractCountries(combined)].map(String).filter(Boolean))].slice(0, 12);
  const entities = [...new Set([...(input.entities || []), ...extractEntities(combined)].map(String).filter(Boolean))].slice(0, 24);
  const tickers = [...new Set([...(input.tickers || []), ...extractTickers(combined)].map(String).filter(Boolean))].slice(0, 16);
  const tone = Number(input.tone);
  return Object.freeze({
    id,
    externalId: externalId || null,
    title,
    summary,
    url,
    sourceName,
    sourceDomain,
    sourceType: compact(input.sourceType, 'NEWS', 24).toUpperCase(),
    author: compact(input.author, '', 120) || null,
    language: compact(input.language, 'en', 16).toLowerCase(),
    country: compact(input.country, '', 80) || null,
    countries: Object.freeze(countries),
    category,
    entities: Object.freeze(entities),
    tickers: Object.freeze(tickers),
    publishedAt: toIso(publishedTimestamp),
    discoveredAt: toIso(input.discoveredAt || now),
    imageUrl: safeUrl(input.imageUrl || input.image),
    engagement: Object.freeze({
      likes: Math.max(0, Number(input.engagement?.likes || input.likes || 0)),
      reposts: Math.max(0, Number(input.engagement?.reposts || input.reposts || 0)),
      replies: Math.max(0, Number(input.engagement?.replies || input.replies || 0)),
      quotes: Math.max(0, Number(input.engagement?.quotes || input.quotes || 0)),
      views: Math.max(0, Number(input.engagement?.views || input.views || 0))
    }),
    tone: Number.isFinite(tone) ? round(clamp(tone, -100, 100), 2) : null,
    metadata: Object.freeze(input.metadata && typeof input.metadata === 'object' ? { ...input.metadata } : {})
  });
}
