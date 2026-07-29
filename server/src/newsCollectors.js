const { cachedText, cachedJson } = require('./http');
const { parseXmlItems, cleanText, domainFromUrl, stableId, isEnglishLike, pointFromName } = require('./util');
const cache = require('./cache');
const { NEWS_SOURCE_GROUPS, EXCLUDED_DOMAINS, JUNK_TERMS, TRUSTED_DOMAINS } = require('./sourcePlan');
const { CITY_SEEDS } = require('./citySeeds');

const TTL = 8 * 60 * 1000;
const MAX_QUERIES_PER_GROUP = 3;

function isJunk(item) {
  const text = `${item.title || ''} ${item.description || ''} ${item.link || ''}`.toLowerCase();
  const domain = domainFromUrl(item.link).toLowerCase();
  if (!isEnglishLike(item.title || item.description || '')) return true;
  if (EXCLUDED_DOMAINS.some(d => domain.includes(d))) return true;
  if (JUNK_TERMS.some(term => text.includes(term))) return true;
  if (/celebrity|gossip|sports|movie|tv show|horoscope|outfit|uniform|barron|tate/i.test(text)) return true;
  return false;
}

function trustScore(item) {
  const domain = domainFromUrl(item.link).toLowerCase();
  let score = 35;
  if (TRUSTED_DOMAINS.some(d => domain.includes(d))) score += 30;
  if (/reuters|apnews|bbc|aljazeera|reliefweb|usgs|gov|ecb|worldbank/i.test(domain)) score += 20;
  if (/google.com|news.google/i.test(domain)) score += 5;
  if (/blog|medium|substack|opinion/i.test(domain)) score -= 12;
  return Math.max(0, Math.min(100, score));
}

function categoryFromText(text) {
  const s = String(text || '').toLowerCase();
  if (/missile|drone|war|battle|airstrike|frontline|shelling|troop|military|invasion/.test(s)) return 'conflict';
  if (/terror|attack|attacker|shooting|bomb|hostage|stabbing|explosion/.test(s)) return 'security';
  if (/oil|gas|gold|silver|copper|wheat|corn|shipping|port|suez|hormuz|freight|commodity|supply/.test(s)) return 'market-moving';
  if (/election|parliament|sanction|tariff|law|regulation|minister|president|policy/.test(s)) return 'policy';
  if (/airport|border|strike|rail|road|route|travel|visa/.test(s)) return 'movement';
  if (/remote|freelance|startup|automation|business|lead|client|service|saas/.test(s)) return 'online-opportunity';
  if (/earthquake|flood|storm|wildfire|cyclone|hurricane|drought|volcano/.test(s)) return 'crisis';
  return 'general';
}

function opportunityAngle(item) {
  const text = `${item.title} ${item.description}`.toLowerCase();
  if (/oil|gas|gold|silver|copper|wheat|shipping|port|suez|hormuz|commodity|supply/.test(text)) {
    return 'Check related assets and businesses affected by supply or transport changes.';
  }
  if (/regulation|sanction|tariff|policy|visa|tax/.test(text)) {
    return 'Turn the policy change into a plain-English explainer, compliance checklist or lead list.';
  }
  if (/airport|border|strike|route|travel/.test(text)) {
    return 'Package this as a travel disruption note for travellers, expats or small businesses.';
  }
  if (/security|protest|attack|conflict|war|missile|drone/.test(text)) {
    return 'Use this to update area scans, routes, and paid safety briefings for affected places.';
  }
  if (/remote|freelance|automation|ai|startup|business/.test(text)) {
    return 'Look for a small service offer, lead list, automation template or short paid research job.';
  }
  return 'Look for an information gap: who needs this explained before the mainstream catches up?';
}

async function googleNews(query, groupId) {
  const key = `rss:google:${groupId}:${query}`;
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-GB&gl=GB&ceid=GB:en`;
  try {
    const xml = await cachedText(key, url, TTL, `Google News ${groupId}`, { timeout: 4500 });
    return parseXmlItems(xml).map(item => ({ ...item, sourceSystem: 'Google News', query, groupId }));
  } catch {
    return [];
  }
}

async function hnSearch(query) {
  const key = `hn:${query}`;
  const url = `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(query)}&tags=story&hitsPerPage=15`;
  try {
    const data = await cachedJson(key, url, TTL, 'Hacker News Algolia', { timeout: 4500 });
    return (data.hits || []).map(h => ({
      title: cleanText(h.title || h.story_title || ''),
      link: h.url || `https://news.ycombinator.com/item?id=${h.objectID}`,
      description: cleanText(h.comment_text || ''),
      pubDate: h.created_at,
      sourceSystem: 'Hacker News',
      query,
      groupId: 'online-opportunity'
    }));
  } catch {
    return [];
  }
}

async function gdeltDocs() {
  const query = '(war OR missile OR drone OR shipping OR oil OR gold OR copper OR wheat OR sanctions OR border OR airport OR protest OR strike OR regulation OR startup OR remote work) sourcelang:English';
  const url = `https://api.gdeltproject.org/api/v2/doc/doc?query=${encodeURIComponent(query)}&mode=ArtList&format=json&maxrecords=100&sort=DateDesc`;
  try {
    const data = await cachedJson('gdelt:docs:opportunity', url, TTL, 'GDELT Docs', { timeout: 5000 });
    return (data.articles || []).map(a => ({
      title: cleanText(a.title || ''),
      link: a.url || '',
      description: cleanText(a.title || ''),
      pubDate: a.seendate,
      sourceSystem: 'GDELT',
      query: 'global event stream',
      groupId: 'global-events'
    }));
  } catch {
    return [];
  }
}

function normalizeItem(raw) {
  const title = cleanText(raw.title);
  const description = cleanText(raw.description || '');
  const link = raw.link || '';
  const domain = domainFromUrl(link) || raw.sourceSystem || 'source';
  const text = `${title} ${description}`;
  const place = pointFromName(text, CITY_SEEDS);
  return {
    id: stableId(`${title}-${link}`),
    title,
    description: description.slice(0, 360),
    link,
    domain,
    sourceSystem: raw.sourceSystem || 'RSS',
    groupId: raw.groupId || 'general',
    query: raw.query || '',
    category: categoryFromText(text),
    trustScore: trustScore({ title, description, link }),
    opportunity: opportunityAngle({ title, description }),
    pubDate: raw.pubDate || null,
    place,
    lat: place ? place.lat : null,
    lng: place ? place.lng : null
  };
}

async function collectNews() {
  const cached = cache.get('news:all');
  if (cached) return cached;
  const tasks = [];
  for (const group of NEWS_SOURCE_GROUPS) {
    for (const query of group.queries.slice(0, MAX_QUERIES_PER_GROUP)) tasks.push(googleNews(query, group.id));
  }
  tasks.push(hnSearch('remote freelance business automation'));
  tasks.push(hnSearch('startup ideas ai automation'));
  tasks.push(hnSearch('supply chain disruption business'));
  tasks.push(gdeltDocs());
  const settled = await Promise.allSettled(tasks);
  const raw = settled.flatMap(r => r.status === 'fulfilled' ? r.value : []);
  const seen = new Set();
  const items = [];
  for (const item of raw) {
    const norm = normalizeItem(item);
    if (!norm.title || !norm.link || isJunk(norm)) continue;
    const key = norm.title.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 80);
    if (seen.has(key)) continue;
    seen.add(key);
    items.push(norm);
  }
  items.sort((a, b) => (b.trustScore - a.trustScore) || String(b.pubDate || '').localeCompare(String(a.pubDate || '')));
  cache.mark('News compiler', 'OK', { detail: `${items.length} usable items` });
  return cache.set('news:all', items.slice(0, 240), TTL);
}

module.exports = { collectNews };
