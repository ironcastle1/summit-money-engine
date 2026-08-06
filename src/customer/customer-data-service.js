import path from 'node:path';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { decodeXml, extractItems, extractTag } from '../util/xml.js';
import {
  buildStrategicWatchAreas,
  focusRegionIdsForArticle,
  focusRegionIdsForCountry,
  priorityRegionCatalog,
  regionSummary,
  regionalGdeltQueries
} from './priority-regions.js';

const HOUR = 3_600_000;
const EARTHQUAKE_RE = /\b(?:earthquake|aftershock|seismic|quake|magnitude\s*[0-9])\b/i;
const CONFLICT_RE = /\b(?:war|conflict|attack|airstrike|missile|drone|shelling|troops?|military|ceasefire|invasion|armed|hostage|border clash|coup)\b/i;
const LOGISTICS_RE = /\b(?:port|shipping|ship|freight|container|canal|chokepoint|rail|airport|cargo|route|supply chain|delivery|blockade|closure)\b/i;
const MARKET_RE = /\b(?:market|stocks?|shares?|bond|currency|oil|gas|gold|copper|commodity|inflation|interest rate|tariff|trade|export|import|sanction)\b/i;
const POLITICS_RE = /\b(?:election|parliament|government|president|prime minister|minister|protest|sanction|policy|regulation|diplomatic)\b/i;
const DISRUPTION_RE = /\b(?:outage|closure|closed|disruption|strike|shortage|delay|halted|suspended|flood|wildfire|storm|cyclone|hurricane|eruption)\b/i;

const DEFAULT_FEEDS = Object.freeze([
  { id: 'bbc-world', name: 'BBC World', url: 'https://feeds.bbci.co.uk/news/world/rss.xml', domain: 'bbc.co.uk' },
  { id: 'bbc-europe', name: 'BBC Europe', url: 'https://feeds.bbci.co.uk/news/world/europe/rss.xml', domain: 'bbc.co.uk', regionId: 'europe' },
  { id: 'bbc-middle-east', name: 'BBC Middle East', url: 'https://feeds.bbci.co.uk/news/world/middle_east/rss.xml', domain: 'bbc.co.uk', regionId: 'middle-east' },
  { id: 'bbc-asia', name: 'BBC Asia', url: 'https://feeds.bbci.co.uk/news/world/asia/rss.xml', domain: 'bbc.co.uk', regionId: 'major-asia' },
  { id: 'bbc-us-canada', name: 'BBC US & Canada', url: 'https://feeds.bbci.co.uk/news/world/us_and_canada/rss.xml', domain: 'bbc.co.uk', regionId: 'united-states' },
  { id: 'bbc-africa', name: 'BBC Africa', url: 'https://feeds.bbci.co.uk/news/world/africa/rss.xml', domain: 'bbc.co.uk', regionId: 'north-africa' },
  { id: 'bbc-business', name: 'BBC Business', url: 'https://feeds.bbci.co.uk/news/business/rss.xml', domain: 'bbc.co.uk' },
  { id: 'guardian-world', name: 'The Guardian World', url: 'https://www.theguardian.com/world/rss', domain: 'theguardian.com' },
  { id: 'guardian-business', name: 'The Guardian Business', url: 'https://www.theguardian.com/uk/business/rss', domain: 'theguardian.com' },
  { id: 'aljazeera', name: 'Al Jazeera', url: 'https://www.aljazeera.com/xml/rss/all.xml', domain: 'aljazeera.com', regionId: 'middle-east' },
  { id: 'lemonde-world', name: 'Le Monde World', url: 'https://www.lemonde.fr/en/international/rss_full.xml', domain: 'lemonde.fr', regionId: 'europe' }
]);

const MARKET_ASSETS = Object.freeze([
  { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin' },
  { id: 'ethereum', symbol: 'ETH', name: 'Ethereum' },
  { id: 'solana', symbol: 'SOL', name: 'Solana' },
  { id: 'cardano', symbol: 'ADA', name: 'Cardano' },
  { id: 'avalanche-2', symbol: 'AVAX', name: 'Avalanche' },
  { id: 'dogecoin', symbol: 'DOGE', name: 'Dogecoin' }
]);

function finite(value) { return Number.isFinite(Number(value)); }
function clamp(value, minimum, maximum) { return Math.max(minimum, Math.min(maximum, Number(value) || 0)); }
function cleanText(value, fallback = '') {
  return String(value ?? fallback)
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
function timestamp(value) { const parsed = Date.parse(value); return Number.isFinite(parsed) ? parsed : 0; }
function iso(value) { const parsed = timestamp(value); return parsed ? new Date(parsed).toISOString() : null; }
function slug(value) { return cleanText(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 90); }
function domainFromUrl(url) { try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return ''; } }
function sourceQuality(domain) {
  const value = String(domain || '').toLowerCase();
  if (/bbc\.co\.uk|reuters\.com|apnews\.com|ft\.com|bloomberg\.com/.test(value)) return 88;
  if (/theguardian\.com|aljazeera\.com|lemonde\.fr|dw\.com|cnbc\.com/.test(value)) return 78;
  if (/gov|\.int$|un\.org|worldbank\.org/.test(value)) return 86;
  return 62;
}
function classify(text) {
  const value = String(text || '');
  if (CONFLICT_RE.test(value)) return 'conflict';
  if (LOGISTICS_RE.test(value) || DISRUPTION_RE.test(value)) return 'disruption';
  if (MARKET_RE.test(value)) return 'markets';
  if (POLITICS_RE.test(value)) return 'politics';
  return 'world';
}
function impactLabel(category) {
  return {
    conflict: 'Security and regional risk',
    disruption: 'Transport or supply disruption',
    markets: 'Market-moving development',
    politics: 'Political or regulatory change',
    world: 'Current world development'
  }[category] || 'Current development';
}
function delay(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

async function fetchWithDeadline(fetchImpl, url, options = {}) {
  const controller = new AbortController();
  const timeoutMs = Math.max(500, Number(options.timeoutMs || 3_800));
  const timer = setTimeout(() => controller.abort(new Error('Source deadline exceeded')), timeoutMs);
  try {
    const response = await fetchImpl(url, {
      headers: {
        accept: options.accept || 'application/json, text/plain, */*',
        'user-agent': options.userAgent || 'Merlin/24.1 public-data-client'
      },
      signal: controller.signal
    });
    if (!response.ok) throw Object.assign(new Error(`Upstream returned ${response.status}`), { code: 'UPSTREAM_HTTP', status: response.status });
    return options.as === 'text' ? await response.text() : await response.json();
  } finally {
    clearTimeout(timer);
  }
}

function atomEntries(xml) { return [...String(xml || '').matchAll(/<entry\b[^>]*>([\s\S]*?)<\/entry>/gi)].map(match => match[1]); }
function atomLink(entry) {
  const match = entry.match(/<link\b[^>]*href=["']([^"']+)["'][^>]*>/i);
  return decodeXml(match?.[1] || '');
}
function rssLink(item) { return extractTag(item, 'link') || extractTag(item, 'guid'); }
function feedTitle(xml, fallback) {
  const channel = String(xml || '').match(/<channel\b[^>]*>([\s\S]*?)<\/channel>/i)?.[1] || xml;
  return cleanText(extractTag(channel, 'title'), fallback);
}
function parseFeed(xml, feed, cutoff) {
  const name = feed.name || feedTitle(xml, feed.domain);
  const items = extractItems(xml);
  const records = items.length ? items.map(item => ({ item, atom: false })) : atomEntries(xml).map(item => ({ item, atom: true }));
  return records.flatMap(({ item, atom }, index) => {
    const title = cleanText(extractTag(item, 'title'));
    const summary = cleanText(extractTag(item, atom ? 'summary' : 'description') || extractTag(item, 'content:encoded') || extractTag(item, 'content'));
    const publishedAt = extractTag(item, atom ? 'published' : 'pubDate') || extractTag(item, 'updated') || extractTag(item, 'dc:date');
    const published = timestamp(publishedAt);
    const url = atom ? atomLink(item) : rssLink(item);
    if (!title || !published || published < cutoff || EARTHQUAKE_RE.test(`${title} ${summary}`)) return [];
    return [{
      id: `${feed.id}-${slug(title) || index}`,
      title,
      summary: summary || 'Open the original source for full details.',
      url,
      source: name,
      sourceDomain: feed.domain || domainFromUrl(url),
      publishedAt: new Date(published).toISOString(),
      sourceType: 'RSS',
      sourceRegionId: feed.regionId || null
    }];
  });
}

function parseGdeltDate(value) {
  const text = String(value || '').trim();
  const match = text.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/);
  return match ? `${match[1]}-${match[2]}-${match[3]}T${match[4]}:${match[5]}:${match[6]}Z` : value;
}

function uniqueArticles(records) {
  const seen = new Set();
  return records.filter(record => {
    const key = String(record.url || record.title).toLowerCase().replace(/[#?].*$/, '').replace(/\W+/g, ' ').trim();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function aliasEntries(countries, cities) {
  const records = [];
  for (const country of countries) {
    const aliases = new Set([country.name, country.nativeName, country.iso2, country.iso3, ...(country.aliases || [])]);
    for (const alias of aliases) {
      const value = cleanText(alias).toLowerCase();
      if (value.length < 3) continue;
      records.push({ alias: value, priority: 100 + value.length, location: { type: 'country', name: country.name, localName: country.nativeName || '', countryCode: country.iso2, lat: Number(country.lat), lon: Number(country.lon) } });
    }
  }
  for (const city of cities) {
    const value = cleanText(city.name).toLowerCase();
    if (value.length < 3) continue;
    records.push({ alias: value, priority: 180 + value.length, location: { type: 'city', name: city.name, localName: city.localName || '', country: city.country, countryCode: city.countryCode, lat: Number(city.lat), lon: Number(city.lon) } });
  }
  return records.sort((a, b) => b.priority - a.priority);
}

function locateArticle(article, aliases) {
  const haystack = ` ${cleanText(`${article.title} ${article.summary}`).toLowerCase()} `;
  for (const record of aliases) {
    const escaped = record.alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (new RegExp(`(?:^|[^\\p{L}\\p{N}])${escaped}(?:$|[^\\p{L}\\p{N}])`, 'iu').test(haystack)) return record.location;
  }
  return null;
}

function publicArticle(article, location, focusRegionIds = []) {
  const text = `${article.title} ${article.summary}`;
  const category = classify(text);
  const publishedAt = iso(article.publishedAt);
  return Object.freeze({
    id: article.id,
    type: 'news',
    title: article.title,
    summary: article.summary,
    url: article.url,
    source: article.source,
    sourceDomain: article.sourceDomain,
    sourceQuality: sourceQuality(article.sourceDomain),
    publishedAt,
    category,
    impact: impactLabel(category),
    focusRegionIds: Object.freeze([...focusRegionIds]),
    priorityCoverage: focusRegionIds.length > 0,
    coordinates: location && finite(location.lat) && finite(location.lon) ? { lat: Number(location.lat), lon: Number(location.lon) } : null,
    location: location ? { name: location.name, localName: location.localName || '', country: location.country || location.name, countryCode: location.countryCode || '' } : null
  });
}

function marketFromCoinGecko(payload) {
  return MARKET_ASSETS.flatMap(asset => {
    const value = payload?.[asset.id];
    if (!finite(value?.usd)) return [];
    return [{
      id: asset.id,
      symbol: asset.symbol,
      name: asset.name,
      price: Number(value.usd),
      change24h: finite(value.usd_24h_change) ? Number(value.usd_24h_change) : null,
      updatedAt: value.last_updated_at ? new Date(Number(value.last_updated_at) * 1000).toISOString() : new Date().toISOString(),
      source: 'CoinGecko'
    }];
  });
}

function marketOpportunity(market) {
  if (!finite(market.change24h) || Math.abs(market.change24h) < 1.25) return null;
  const rising = market.change24h > 0;
  return {
    id: `market-${market.id}`,
    type: 'market',
    title: `${market.symbol} ${rising ? 'rose' : 'fell'} ${Math.abs(market.change24h).toFixed(1)}% in 24 hours`,
    score: Math.round(clamp(54 + Math.abs(market.change24h) * 3, 55, 88)),
    evidence: `${market.source} public market data`,
    observedAt: market.updatedAt,
    customer: 'Traders and businesses exposed to this asset',
    whyItMatters: `A ${Math.abs(market.change24h).toFixed(1)}% move can reveal a new catalyst, liquidity shift or broader risk change.`,
    action: 'Check the catalyst, volume and related assets before deciding whether the move is durable.',
    risk: 'Price movement alone is not proof of a tradeable edge.',
    sourceUrl: null,
    focusRegionIds: []
  };
}

function newsOpportunity(article) {
  if (!['conflict', 'disruption', 'markets', 'politics'].includes(article.category)) return null;
  const ageHours = Math.max(0, (Date.now() - timestamp(article.publishedAt)) / HOUR);
  const base = { conflict: 65, disruption: 72, markets: 62, politics: 55 }[article.category];
  const score = Math.round(clamp(base + article.sourceQuality * 0.12 - ageHours * 1.4, 42, 89));
  const profiles = {
    conflict: {
      customer: 'Importers, insurers, security providers and firms with regional exposure',
      why: 'Conflict can change route availability, insurance cost, commodity supply and local demand.',
      action: 'Map the exposed routes, suppliers and customers, then verify whether costs or availability have changed.',
      risk: 'Initial reporting may be incomplete or politically contested.'
    },
    disruption: {
      customer: 'Buyers facing delays, distributors, freight brokers and replacement suppliers',
      why: 'A closure, shortage or transport interruption can create urgent demand for alternatives.',
      action: 'Identify affected buyers and confirm which alternative supplier, port or carrier can deliver now.',
      risk: 'The disruption may be short-lived or geographically limited.'
    },
    markets: {
      customer: 'Businesses and investors exposed to the affected commodity, currency or sector',
      why: 'The report may alter demand, costs, inventory expectations or market positioning.',
      action: 'Confirm the catalyst against price, volume and at least one independent source.',
      risk: 'The market may already have priced in the information.'
    },
    politics: {
      customer: 'Exporters, compliance teams and firms exposed to policy or regulatory change',
      why: 'Policy, sanctions and elections can alter market access, taxes, trade and procurement.',
      action: 'Check the official measure, effective date and affected sectors before contacting exposed firms.',
      risk: 'Proposals may change before implementation.'
    }
  }[article.category];
  return {
    id: `news-${article.id}`,
    type: 'news',
    title: article.title,
    score,
    evidence: `${article.source} · ${article.location?.name || 'global'}`,
    observedAt: article.publishedAt,
    customer: profiles.customer,
    whyItMatters: profiles.why,
    action: profiles.action,
    risk: profiles.risk,
    sourceUrl: article.url,
    articleId: article.id,
    coordinates: article.coordinates,
    focusRegionIds: article.focusRegionIds || []
  };
}

function sourceRecord(id, name, result, startedAt) {
  return {
    id,
    name,
    state: result.status === 'fulfilled' && result.value?.length !== 0 ? 'ONLINE' : result.status === 'fulfilled' ? 'EMPTY' : 'OFFLINE',
    recordCount: result.status === 'fulfilled' ? (Array.isArray(result.value) ? result.value.length : 1) : 0,
    durationMs: Date.now() - startedAt,
    error: result.status === 'rejected' ? cleanText(result.reason?.message, 'Source unavailable') : null
  };
}

export class CustomerDataService {
  constructor(options) {
    this.fetchImpl = options.fetchImpl || globalThis.fetch;
    this.logger = options.logger;
    this.countries = options.countries || [];
    this.cities = options.cities || [];
    this.ports = options.ports || [];
    this.routes = options.routes || [];
    this.aliases = aliasEntries(this.countries, this.cities);
    this.countryIndex = new Map(this.countries.map(country => [String(country.iso2 || '').toUpperCase(), country]));
    this.regionCatalog = priorityRegionCatalog(this.countries);
    this.watchAreas = buildStrategicWatchAreas(this.regionCatalog);
    this.priorityCountries = this.countries.filter(country => focusRegionIdsForCountry(country, this.regionCatalog).length > 0);
    this.cacheFile = options.cacheFile || null;
    this.cache = null;
    this.inflight = null;
  }

  static async create(options = {}) {
    const rootDir = options.rootDir;
    const [countryPayload, cityPayload, portPayload, routePayload] = await Promise.all([
      readFile(path.join(rootDir, 'data/countries.json'), 'utf8').then(JSON.parse),
      readFile(path.join(rootDir, 'data/cities.json'), 'utf8').then(JSON.parse),
      readFile(path.join(rootDir, 'data/ports.json'), 'utf8').then(JSON.parse),
      readFile(path.join(rootDir, 'data/routes.json'), 'utf8').then(JSON.parse)
    ]);
    const service = new CustomerDataService({
      ...options,
      countries: countryPayload.countries || [],
      cities: cityPayload.cities || [],
      ports: portPayload.ports || [],
      routes: routePayload.features || []
    });
    await service.#loadDiskCache();
    return service;
  }

  async snapshot(options = {}) {
    const hours = Math.max(1, Math.min(24, Number(options.hours || 12)));
    const maximumAgeMs = options.force ? 0 : 90_000;
    if (this.cache && Date.now() - timestamp(this.cache.generatedAt) < maximumAgeMs && this.cache.windowHours === hours) return this.cache;
    if (this.inflight) return this.inflight;
    this.inflight = this.#refresh(hours).finally(() => { this.inflight = null; });
    return this.inflight;
  }

  async #refresh(hours) {
    const cutoff = Date.now() - hours * HOUR;
    const sourceStatus = [];
    const articleTasks = [];

    for (const query of regionalGdeltQueries(this.regionCatalog)) {
      const startedAt = Date.now();
      const gdeltUrl = new URL('https://api.gdeltproject.org/api/v2/doc/doc');
      gdeltUrl.searchParams.set('query', query.query);
      gdeltUrl.searchParams.set('mode', 'artlist');
      gdeltUrl.searchParams.set('format', 'json');
      gdeltUrl.searchParams.set('maxrecords', '55');
      gdeltUrl.searchParams.set('sort', 'DateDesc');
      gdeltUrl.searchParams.set('timespan', `${hours}h`);
      const task = fetchWithDeadline(this.fetchImpl, gdeltUrl, { timeoutMs: 4_800 }).then(payload => (payload.articles || []).flatMap((item, index) => {
        const publishedAt = parseGdeltDate(item.seendate);
        if (!item.title || timestamp(publishedAt) < cutoff || EARTHQUAKE_RE.test(item.title)) return [];
        return [{
          id: `${query.id}-${slug(item.url || item.title) || index}`,
          title: cleanText(item.title),
          summary: cleanText(item.summary || item.context || ''),
          url: item.url,
          source: cleanText(item.domain, 'GDELT source'),
          sourceDomain: cleanText(item.domain),
          publishedAt,
          sourceType: 'GDELT',
          sourceRegionId: query.regionId
        }];
      })).then(value => {
        sourceStatus.push(sourceRecord(query.id, query.name, { status: 'fulfilled', value }, startedAt));
        return value;
      }).catch(error => {
        sourceStatus.push(sourceRecord(query.id, query.name, { status: 'rejected', reason: error }, startedAt));
        return [];
      });
      articleTasks.push(task);
    }

    for (const feed of DEFAULT_FEEDS) {
      const startedAt = Date.now();
      const task = fetchWithDeadline(this.fetchImpl, feed.url, { as: 'text', accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml, */*', timeoutMs: 3_800 })
        .then(xml => parseFeed(xml, feed, cutoff))
        .then(value => { sourceStatus.push(sourceRecord(feed.id, feed.name, { status: 'fulfilled', value }, startedAt)); return value; })
        .catch(error => { sourceStatus.push(sourceRecord(feed.id, feed.name, { status: 'rejected', reason: error }, startedAt)); return []; });
      articleTasks.push(task);
    }

    for (const region of this.regionCatalog) {
      const startedAt = Date.now();
      const queryTerms = region.queryTerms.slice(0, 12).map(term => `"${term}"`).join(' OR ');
      const commercialTerms = '(shipping OR trade OR sanctions OR conflict OR energy OR port OR election OR tariff OR supply OR market)';
      const googleUrl = new URL('https://news.google.com/rss/search');
      googleUrl.searchParams.set('q', `(${queryTerms}) ${commercialTerms} when:1d`);
      googleUrl.searchParams.set('hl', 'en-GB');
      googleUrl.searchParams.set('gl', 'GB');
      googleUrl.searchParams.set('ceid', 'GB:en');
      const feed = { id: `google-news-${region.id}`, name: `Google News · ${region.label}`, url: googleUrl, domain: 'news.google.com', regionId: region.id };
      const task = fetchWithDeadline(this.fetchImpl, googleUrl, { as: 'text', accept: 'application/rss+xml, application/xml, text/xml, */*', timeoutMs: 4_200 })
        .then(xml => parseFeed(xml, feed, cutoff))
        .then(value => { sourceStatus.push(sourceRecord(feed.id, feed.name, { status: 'fulfilled', value }, startedAt)); return value; })
        .catch(error => { sourceStatus.push(sourceRecord(feed.id, feed.name, { status: 'rejected', reason: error }, startedAt)); return []; });
      articleTasks.push(task);
    }

    const marketStarted = Date.now();
    const marketUrl = new URL('https://api.coingecko.com/api/v3/simple/price');
    marketUrl.searchParams.set('ids', MARKET_ASSETS.map(item => item.id).join(','));
    marketUrl.searchParams.set('vs_currencies', 'usd');
    marketUrl.searchParams.set('include_24hr_change', 'true');
    marketUrl.searchParams.set('include_last_updated_at', 'true');
    const marketTask = fetchWithDeadline(this.fetchImpl, marketUrl, { timeoutMs: 3_800 })
      .then(marketFromCoinGecko)
      .then(value => { sourceStatus.push(sourceRecord('coingecko', 'CoinGecko', { status: 'fulfilled', value }, marketStarted)); return value; })
      .catch(error => { sourceStatus.push(sourceRecord('coingecko', 'CoinGecko', { status: 'rejected', reason: error }, marketStarted)); return []; });

    const articleGroups = await Promise.all(articleTasks);
    const rawArticles = uniqueArticles(articleGroups.flat())
      .filter(article => timestamp(article.publishedAt) >= cutoff)
      .filter(article => !EARTHQUAKE_RE.test(`${article.title} ${article.summary}`));
    const articles = rawArticles
      .map(article => {
        const location = locateArticle(article, this.aliases);
        const focusRegionIds = [...new Set([
          ...(article.sourceRegionId ? [article.sourceRegionId] : []),
          ...focusRegionIdsForArticle(article, location, this.countryIndex, this.regionCatalog)
        ])];
        return publicArticle(article, location, focusRegionIds);
      })
      .sort((a, b) => {
        const priorityDifference = Number(b.priorityCoverage) - Number(a.priorityCoverage);
        return priorityDifference || timestamp(b.publishedAt) - timestamp(a.publishedAt);
      })
      .slice(0, 260);
    const markets = await marketTask;
    const opportunities = [
      ...articles.map(newsOpportunity).filter(Boolean),
      ...markets.map(marketOpportunity).filter(Boolean)
    ].sort((a, b) => Number((b.focusRegionIds || []).length > 0) - Number((a.focusRegionIds || []).length > 0) || b.score - a.score || timestamp(b.observedAt) - timestamp(a.observedAt)).slice(0, 60);
    const conflicts = articles.filter(article => article.category === 'conflict').slice(0, 60);
    const mappedArticles = articles.filter(article => article.coordinates).slice(0, 140);
    const countryActivity = new Map();
    for (const article of mappedArticles) {
      const code = article.location?.countryCode || '';
      if (!code) continue;
      const record = countryActivity.get(code) || { countryCode: code, country: article.location.country || article.location.name, count: 0, latestAt: article.publishedAt, categories: new Set(), articleIds: [] };
      record.count += 1;
      record.categories.add(article.category);
      record.articleIds.push(article.id);
      if (timestamp(article.publishedAt) > timestamp(record.latestAt)) record.latestAt = article.publishedAt;
      countryActivity.set(code, record);
    }
    const countries = [...countryActivity.values()].map(item => ({ ...item, categories: [...item.categories] })).sort((a, b) => b.count - a.count).slice(0, 120);
    const focusRegions = this.regionCatalog.map(region => regionSummary(region, articles, opportunities, this.countries, this.ports, this.routes));
    const priorityCountries = this.priorityCountries.map(country => {
      const activity = countryActivity.get(country.iso2);
      const focusRegionIds = focusRegionIdsForCountry(country, this.regionCatalog);
      const countryPorts = this.ports.filter(port => port.countryCode === country.iso2);
      const routeIds = new Set(countryPorts.flatMap(port => port.routeIds || []));
      return Object.freeze({
        ...country,
        focusRegionIds,
        activityCount: activity?.count || 0,
        latestAt: activity?.latestAt || null,
        categories: activity ? [...activity.categories] : [],
        articleIds: activity?.articleIds || [],
        portCount: countryPorts.length,
        routeCount: routeIds.size,
        priorityCoverage: true
      });
    }).sort((a, b) => b.activityCount - a.activityCount || b.populationBaseline - a.populationBaseline);
    const newestAt = articles[0]?.publishedAt || markets.map(item => item.updatedAt).sort().at(-1) || null;
    const onlineSources = sourceStatus.filter(source => source.state === 'ONLINE').length;
    const status = onlineSources ? 'LIVE' : this.cache ? 'CACHED' : 'LIMITED';
    const snapshot = Object.freeze({
      version: '24.1.0',
      status,
      windowHours: hours,
      generatedAt: new Date().toISOString(),
      newestAt,
      articles,
      mappedArticles,
      conflicts,
      markets,
      opportunities,
      countries,
      focusRegions,
      priorityCountries,
      watchAreas: this.watchAreas,
      ports: this.ports,
      routes: this.routes,
      sources: sourceStatus.sort((a, b) => a.name.localeCompare(b.name)),
      counts: {
        articles: articles.length,
        mappedArticles: mappedArticles.length,
        conflicts: conflicts.length,
        opportunities: opportunities.length,
        markets: markets.length,
        ports: this.ports.length,
        routes: this.routes.length,
        focusRegions: focusRegions.length,
        priorityCountries: priorityCountries.length,
        watchAreas: this.watchAreas.length,
        onlineSources
      }
    });

    if (articles.length || markets.length) {
      this.cache = snapshot;
      await this.#saveDiskCache(snapshot);
      return snapshot;
    }
    if (this.cache && Date.now() - timestamp(this.cache.generatedAt) <= 30 * 60_000) {
      return Object.freeze({ ...this.cache, status: 'CACHED', generatedAt: new Date().toISOString(), sources: sourceStatus, cacheAgeSeconds: Math.round((Date.now() - timestamp(this.cache.generatedAt)) / 1000) });
    }
    this.cache = snapshot;
    return snapshot;
  }

  async #loadDiskCache() {
    if (!this.cacheFile) return;
    try {
      const payload = JSON.parse(await readFile(this.cacheFile, 'utf8'));
      if (payload?.generatedAt && Date.now() - timestamp(payload.generatedAt) <= 30 * 60_000) this.cache = payload;
    } catch {}
  }

  async #saveDiskCache(snapshot) {
    if (!this.cacheFile) return;
    try {
      await mkdir(path.dirname(this.cacheFile), { recursive: true });
      await writeFile(this.cacheFile, JSON.stringify(snapshot), 'utf8');
    } catch (error) {
      this.logger?.debug?.('customer_snapshot.cache_write_failed', { error });
    }
  }
}
