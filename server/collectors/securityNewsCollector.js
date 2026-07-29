const { fetchText, stripHtml } = require("../core/http");
const { stableId } = require("../core/geo");
const { countryMeta } = require("../data/countryMeta");
const citySeeds = require("../data/citySeeds");
const { startSource, markSuccess, markFailure } = require("../core/sourceHealth");

const RSS_FEEDS = [
  { name: "BBC World", url: "https://feeds.bbci.co.uk/news/world/rss.xml" },
  { name: "UN News", url: "https://news.un.org/feed/subscribe/en/news/all/rss.xml" },
  { name: "BBC UK", url: "https://feeds.bbci.co.uk/news/uk/rss.xml" },
  { name: "Al Jazeera", url: "https://www.aljazeera.com/xml/rss/all.xml" },
  { name: "NPR World", url: "https://feeds.npr.org/1004/rss.xml" },
  { name: "France 24", url: "https://www.france24.com/en/rss" },
  { name: "DW World", url: "https://rss.dw.com/xml/rss-en-world" },
  { name: "Google News Conflict Zones", url: "https://news.google.com/rss/search?q=(Ukraine%20OR%20Russia%20OR%20Syria%20OR%20Sudan%20OR%20Yemen%20OR%20Gaza)%20(airstrike%20OR%20missile%20OR%20shelling%20OR%20combat%20OR%20frontline%20OR%20evacuation)%20when:2d&hl=en-GB&gl=GB&ceid=GB:en" },
  { name: "Google News Border Airport Disruption", url: "https://news.google.com/rss/search?q=(border%20OR%20airport%20OR%20rail%20OR%20port)%20(closed%20OR%20strike%20OR%20evacuation%20OR%20security)%20when:2d&hl=en-GB&gl=GB&ceid=GB:en" },
  { name: "Google News Embassy Travel Security", url: "https://news.google.com/rss/search?q=(embassy%20OR%20consulate%20OR%20travel%20advice%20OR%20evacuation)%20(security%20OR%20warning%20OR%20attack)%20when:2d&hl=en-GB&gl=GB&ceid=GB:en" },
  { name: "Google News Middle East Security", url: "https://news.google.com/rss/search?q=(Syria%20OR%20Lebanon%20OR%20Israel%20OR%20Gaza%20OR%20Iraq%20OR%20Iran)%20(security%20OR%20airstrike%20OR%20missile%20OR%20border%20OR%20evacuation)%20when:2d&hl=en-GB&gl=GB&ceid=GB:en" },
  { name: "Google News Europe Travel Disruption", url: "https://news.google.com/rss/search?q=(Europe%20OR%20UK%20OR%20France%20OR%20Germany)%20(airport%20strike%20OR%20border%20closure%20OR%20protest%20OR%20riot)%20when:2d&hl=en-GB&gl=GB&ceid=GB:en" },
  { name: "Google News Route Safety", url: "https://news.google.com/rss/search?q=(road%20closed%20OR%20checkpoint%20OR%20border%20crossing%20OR%20evacuation%20route%20OR%20curfew)%20(security%20OR%20attack%20OR%20protest%20OR%20conflict)%20when:2d&hl=en-GB&gl=GB&ceid=GB:en" },
  { name: "Google News Infrastructure Outage", url: "https://news.google.com/rss/search?q=(power%20outage%20OR%20internet%20outage%20OR%20mobile%20network%20OR%20water%20shortage%20OR%20fuel%20shortage)%20(security%20OR%20city%20OR%20border%20OR%20travel)%20when:2d&hl=en-GB&gl=GB&ceid=GB:en" },
  { name: "Google News Hospital Security", url: "https://news.google.com/rss/search?q=(hospital%20OR%20clinic%20OR%20pharmacy)%20(attack%20OR%20evacuation%20OR%20closed%20OR%20shortage)%20when:2d&hl=en-GB&gl=GB&ceid=GB:en" },
  { name: "Google News Global Political Unrest", url: "https://news.google.com/rss/search?q=(protest%20OR%20riot%20OR%20civil%20unrest%20OR%20curfew%20OR%20state%20of%20emergency)%20when:2d&hl=en-GB&gl=GB&ceid=GB:en" },
  { name: "Google News Coups Elections Sanctions", url: "https://news.google.com/rss/search?q=(coup%20OR%20election%20violence%20OR%20sanctions%20OR%20parliament%20crisis%20OR%20government%20collapse)%20when:3d&hl=en-GB&gl=GB&ceid=GB:en" },
  { name: "Google News Active Attacker", url: "https://news.google.com/rss/search?q=(active%20shooter%20OR%20active%20attacker%20OR%20mass%20shooting%20OR%20knife%20attack%20OR%20gunman%20OR%20stabbing%20attack)%20when:2d&hl=en-GB&gl=GB&ceid=GB:en" },
  { name: "Google News Europe Crime Security", url: "https://news.google.com/rss/search?q=(burglary%20OR%20robbery%20OR%20stabbing%20OR%20shooting%20OR%20gang%20OR%20police%20operation)%20(Europe%20OR%20UK%20OR%20France%20OR%20Germany%20OR%20Spain%20OR%20Italy)%20when:2d&hl=en-GB&gl=GB&ceid=GB:en" },
  { name: "Google News Embassy Border Security", url: "https://news.google.com/rss/search?q=(embassy%20closed%20OR%20border%20closed%20OR%20checkpoint%20OR%20evacuation%20OR%20consulate%20security)%20when:3d&hl=en-GB&gl=GB&ceid=GB:en" },
];

const KIND_PATTERNS = [
  ["war", /(airstrike|missile strike|rocket attack|shelling|frontline|combat|invasion|drone attack|armed clash|armed clashes|military offensive|troops killed|ceasefire violation|tank attack|artillery strike)/i],
  ["terror", /(terror attack|terrorist|bombing|bomb blast|hostage|gunmen|active shooter|active attacker|mass shooting|knife attack|stabbing attack|suicide bomber|gunman|shooting attack)/i],
  ["crime", /(burglary|robbery|armed robbery|home invasion|car theft|stabbing|shooting|gang violence|police operation|murder investigation|violent crime|crime wave)/i],
  ["movement", /(border closed|border crossing|airport closed|flight cancelled|rail strike|train strike|port closed|road closed|checkpoint|evacuation route|travel warning|travel alert|curfew|lockdown)/i],
  ["politics", /(election violence|election protest|protest|riot|civil unrest|coup|sanction|sanctions|embassy|parliament crisis|government collapse|state of emergency|mass demonstration|political violence|minister resigns|president resigns)/i],
  ["crisis", /(earthquake|flood|wildfire|hurricane|tornado|landslide|humanitarian crisis|famine|evacuation order|disaster)/i],
  ["money", /(capital controls|bank run|banking shutdown|payment outage|currency collapse|sanctions on banks|swift ban|cash withdrawal limit|exchange controls)/i]
];

const BLOCK = /guardian|sports?|football|rugby|cricket|celebrity|tate brothers|andrew tate|trump family|barron|movie|music|fashion|restaurant|commonwealth games|uniforms?|special marine warning|small craft|beach hazard|lake michigan|lottery|horoscope|opinion|columnist|toxic tate|podcast|review|entertainment|uniform|celebrity/i;

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
function subtypeFor(kind, text) {
  const s = String(text || "").toLowerCase();
  if (kind === "politics") {
    if (/coup/.test(s)) return "coup";
    if (/election/.test(s)) return "election";
    if (/sanction/.test(s)) return "sanctions";
    if (/riot|protest|demonstration|civil unrest/.test(s)) return "unrest";
    if (/embassy|consulate/.test(s)) return "diplomatic";
    return "politics";
  }
  if (kind === "terror") {
    if (/active shooter|active attacker|mass shooting|gunman|knife attack|stabbing attack/.test(s)) return "active-attacker";
    return "terror-security";
  }
  if (kind === "crime") {
    if (/burglary|home invasion/.test(s)) return "burglary";
    if (/robbery/.test(s)) return "robbery";
    if (/stabbing|shooting|violent/.test(s)) return "violent-crime";
    return "crime";
  }
  return kind;
}

function wordMatch(haystack, needle) {
  const escaped = String(needle || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^a-z])${escaped}([^a-z]|$)`, "i").test(String(haystack || ""));
}

function locate(text) {
  const s = String(text || "");
  for (const [city, country, lat, lng] of citySeeds) if (wordMatch(s, city)) return { lat, lng, place: city, country, confidence: "city-mentioned news" };
  for (const c of countryMeta) if (wordMatch(s, c.name)) return { lat: c.centre[0], lng: c.centre[1], place: c.name, country: c.name, confidence: "country-mentioned news" };
  return null;
}

function parseRss(xml, feedName) {
  const items = [...String(xml || "").matchAll(/<item>([\s\S]*?)<\/item>/g)].map(m => m[1]);
  return items.map(item => {
    const title = stripHtml(((item.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/) || item.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || ""));
    const desc = stripHtml(((item.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/) || item.match(/<description>([\s\S]*?)<\/description>/) || [])[1] || ""));
    const link = stripHtml((item.match(/<link>([\s\S]*?)<\/link>/) || [])[1] || "");
    const pub = stripHtml((item.match(/<pubDate>([\s\S]*?)<\/pubDate>/) || [])[1] || "");
    const text = `${title} ${desc} ${link}`;
    const kind = classify(text);
    if (!title || !kind || !isEnglish(title)) return null;
    const loc = locate(text);
    if (!loc) return null;
    return {
      id: stableId(`securitynews:${feedName}:${title}:${link}`),
      kind,
      subtype: subtypeFor(kind, text),
      severity: kind === "war" || kind === "terror" ? 4 : kind === "crime" ? 3 : kind === "politics" ? 3 : kind === "crisis" ? 3 : 2,
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
      dataLevel: loc.confidence,
      displayOnMap: String(loc.confidence || "").startsWith("city-mentioned")
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
    } catch (err) { failures += 1; }
  }));
  if (all.length || failures < RSS_FEEDS.length) markSuccess("Security News RSS", all.length, `Loaded strict security/travel RSS from ${RSS_FEEDS.length - failures}/${RSS_FEEDS.length} feeds; Guardian/tabloid/opinion filtered`);
  else markFailure("Security News RSS", new Error("all RSS feeds failed"));
  return all.slice(0, 180);
}
module.exports = { collectSecurityNews };
