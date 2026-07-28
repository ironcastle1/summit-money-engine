const { fetchText, stripHtml } = require("../core/http");
const { stableId } = require("../core/geo");
const { countryMeta } = require("../data/countryMeta");
const citySeeds = require("../data/citySeeds");
const { startSource, markSuccess, markFailure } = require("../core/sourceHealth");

const RSS_FEEDS = [
  { name: "BBC World", url: "https://feeds.bbci.co.uk/news/world/rss.xml" },
  { name: "BBC UK", url: "https://feeds.bbci.co.uk/news/uk/rss.xml" },
  { name: "The Guardian World", url: "https://www.theguardian.com/world/rss" },
  { name: "The Guardian UK", url: "https://www.theguardian.com/uk/rss" },
  { name: "Al Jazeera", url: "https://www.aljazeera.com/xml/rss/all.xml" },
  { name: "NPR World", url: "https://feeds.npr.org/1004/rss.xml" },
  { name: "Google News Security", url: "https://news.google.com/rss/search?q=war%20OR%20terror%20OR%20border%20OR%20protest%20OR%20airport%20disruption%20when:1d&hl=en-GB&gl=GB&ceid=GB:en" },
  { name: "Google News Syria", url: "https://news.google.com/rss/search?q=Syria%20Damascus%20security%20OR%20attack%20OR%20border%20when:7d&hl=en-GB&gl=GB&ceid=GB:en" },
  { name: "Google News Europe Travel", url: "https://news.google.com/rss/search?q=Europe%20travel%20security%20strike%20protest%20airport%20when:2d&hl=en-GB&gl=GB&ceid=GB:en" }
];

const KIND_PATTERNS = [
  ["war", /\b(war|airstrike|missile|shelling|frontline|troops|combat|invasion|drone attack|ceasefire|military offensive)\b/i],
  ["terror", /\b(terror|terrorist|bombing|bomb blast|explosion|hostage|gunmen|mass shooting|knife attack|attack)\b/i],
  ["movement", /\b(border|airport|flight|rail|train|port|strike|road closed|travel warning|travel alert|evacuation|checkpoint|crossing)\b/i],
  ["politics", /\b(protest|riot|unrest|coup|election|sanction|embassy|government|parliament)\b/i],
  ["crisis", /\b(earthquake|flood|wildfire|storm|hurricane|tornado|landslide|disaster|humanitarian|famine|evacuation)\b/i],
  ["money", /\b(bank|currency|inflation|capital controls|sanctions|crypto|payments|FX|oil|gas|gold|wheat)\b/i]
];

const BLOCK = /sports?|football|rugby|cricket|celebrity|movie|music|fashion|restaurant|commonwealth games|uniforms?|special marine warning|small craft|beach hazard|lake michigan|lottery|horoscope/i;

function isEnglish(text) {
  const s = String(text || "");
  if (!s) return false;
  if (/[\u0400-\u04FF\u0600-\u06FF\u4E00-\u9FFF]/.test(s)) return false;
  const nonAscii = (s.match(/[^\x00-\x7F]/g) || []).length;
  return nonAscii / Math.max(s.length, 1) < 0.10;
}

function classify(text) {
  const s = String(text || "");
  if (!s || BLOCK.test(s)) return null;
  for (const [kind, rx] of KIND_PATTERNS) if (rx.test(s)) return kind;
  return null;
}

function wordMatch(haystack, needle) {
  const escaped = String(needle || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^a-z])${escaped}([^a-z]|$)`, "i").test(String(haystack || ""));
}

function locate(text) {
  const s = String(text || "");
  for (const [city, country, lat, lng] of citySeeds) {
    if (wordMatch(s, city)) return { lat, lng, place: city, country, confidence: "city-mentioned news" };
  }
  for (const c of countryMeta) {
    if (wordMatch(s, c.name)) return { lat: c.centre[0], lng: c.centre[1], place: c.name, country: c.name, confidence: "country-mentioned news" };
  }
  return null;
}

function parseRss(xml, feedName) {
  const items = [...String(xml || "").matchAll(/<item>([\s\S]*?)<\/item>/g)].map(m => m[1]);
  return items.map(item => {
    const title = stripHtml(((item.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/) || item.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || ""));
    const desc = stripHtml(((item.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/) || item.match(/<description>([\s\S]*?)<\/description>/) || [])[1] || ""));
    const link = stripHtml((item.match(/<link>([\s\S]*?)<\/link>/) || [])[1] || "");
    const pub = stripHtml((item.match(/<pubDate>([\s\S]*?)<\/pubDate>/) || [])[1] || "");
    const text = `${title} ${desc}`;
    const kind = classify(text);
    if (!title || !kind || !isEnglish(title)) return null;
    const loc = locate(text);
    if (!loc) return null;
    return {
      id: stableId(`securitynews:${feedName}:${title}:${link}`),
      kind,
      severity: kind === "war" || kind === "terror" ? 4 : kind === "crisis" ? 3 : 2,
      title,
      summary: desc || title,
      country: loc.country,
      place: loc.place,
      lat: loc.lat,
      lng: loc.lng,
      source: feedName,
      sourceSystem: "Security News RSS",
      url: link,
      publishedAt: pub || null,
      confidence: loc.confidence,
      dataLevel: loc.confidence
    };
  }).filter(Boolean);
}

async function collectSecurityNews() {
  startSource("Security News RSS", "news-aggregators");
  const all = [];
  let failures = 0;
  await Promise.all(RSS_FEEDS.map(async feed => {
    try {
      const xml = await fetchText(feed.url, { timeout: 12000 });
      all.push(...parseRss(xml, feed.name));
    } catch (err) {
      failures += 1;
    }
  }));
  if (all.length || failures < RSS_FEEDS.length) markSuccess("Security News RSS", all.length, `Loaded security/travel RSS from ${RSS_FEEDS.length - failures}/${RSS_FEEDS.length} feeds`);
  else markFailure("Security News RSS", new Error("all RSS feeds failed"));
  return all.slice(0, 180);
}

module.exports = { collectSecurityNews };
