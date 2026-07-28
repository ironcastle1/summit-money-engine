const { fetchJson, stripHtml } = require("../core/http");
const { stableId } = require("../core/geo");
const { countryMeta } = require("../data/countryMeta");
const citySeeds = require("../data/citySeeds");
const { startSource, markSuccess, markFailure } = require("../core/sourceHealth");

const TERMS = {
  war: [
    /\bwar\b/i,
    /\bwars\b/i,
    /\bmissile(s)?\b/i,
    /\bdrone(s)?\b/i,
    /\bairstrike(s)?\b/i,
    /\bshelling\b/i,
    /\bfrontline\b/i,
    /\bbattle(s)?\b/i,
    /\btroops\b/i,
    /\bmilitary\b/i,
    /\bcombat\b/i,
    /\binvasion\b/i,
    /\bartillery\b/i,
    /\bceasefire\b/i
  ],
  terror: [
    /\bterror\b/i,
    /\bterrorist(s)?\b/i,
    /\bbomb(ing|ed|s)?\b/i,
    /\bexplosion(s)?\b/i,
    /\bhostage(s)?\b/i,
    /\bgunmen\b/i,
    /\bIED\b/i,
    /\bsuicide bomber\b/i,
    /\bmass shooting\b/i
  ],
  crisis: [
    /\bearthquake(s)?\b/i,
    /\bflood(s|ing)?\b/i,
    /\bstorm(s)?\b/i,
    /\bwildfire(s)?\b/i,
    /\btornado(es)?\b/i,
    /\bhurricane(s)?\b/i,
    /\bcyclone(s)?\b/i,
    /\blandslide(s)?\b/i,
    /\bvolcano(es)?\b/i,
    /\bevacuations?\b/i,
    /\bdisaster(s)?\b/i,
    /\bfamine\b/i
  ],
  politics: [
    /\belection(s)?\b/i,
    /\bprotest(s|ers|ing)?\b/i,
    /\briot(s|ing)?\b/i,
    /\bcoup\b/i,
    /\bsanction(s|ed)?\b/i,
    /\bparliament\b/i,
    /\bgovernment\b/i,
    /\bminister\b/i,
    /\bembassy\b/i
  ],
  movement: [
    /\bairport(s)?\b/i,
    /\bborder crossing(s)?\b/i,
    /\brail\b/i,
    /\btrain(s)?\b/i,
    /\bport(s)?\b/i,
    /\bstrike(s)?\b/i,
    /\broad closed\b/i,
    /\bflight(s)? cancelled\b/i,
    /\btravel warning\b/i,
    /\btravel alert\b/i,
    /\bevacuations?\b/i
  ],
  money: [
    /\bbank(s|ing)?\b/i,
    /\bcurrency\b/i,
    /\binflation\b/i,
    /\bcapital controls\b/i,
    /\bsanction(s|ed)?\b/i,
    /\bcrypto\b/i,
    /\bpayments?\b/i,
    /\bFX\b/i
  ]
};

const BLACKLIST = [
  /commonwealth games/i,
  /athletes? warned/i,
  /not to wear uniforms/i,
  /celebrity/i,
  /football/i,
  /rugby/i,
  /cricket/i,
  /premier league/i,
  /transfer/i,
  /movie/i,
  /music/i,
  /fashion/i,
  /restaurant/i,
  /special marine warning/i,
  /small craft advisory/i,
  /beach hazards/i,
  /lake michigan/i
];

function classify(text) {
  const s = String(text || "");
  if (!s || BLACKLIST.some(rx => rx.test(s))) return null;

  for (const [kind, patterns] of Object.entries(TERMS)) {
    if (patterns.some(rx => rx.test(s))) return kind;
  }
  return null;
}

function isEnglish(text) {
  const s = String(text || "");
  if (!s) return false;
  if (/[\u0400-\u04FF\u0600-\u06FF\u4E00-\u9FFF]/.test(s)) return false;
  const nonAscii = (s.match(/[^\x00-\x7F]/g) || []).length;
  return nonAscii / Math.max(s.length, 1) < 0.08;
}

function safeWordIncludes(haystack, needle) {
  const escaped = String(needle || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^a-z])${escaped}([^a-z]|$)`, "i").test(String(haystack || ""));
}

function locate(title) {
  const text = String(title || "");

  for (const [city, country, lat, lng] of citySeeds) {
    if (safeWordIncludes(text, city)) {
      return { lat, lng, place: city, country, confidence: "city-mentioned" };
    }
  }

  for (const c of countryMeta) {
    if (safeWordIncludes(text, c.name)) {
      return { lat: c.centre[0], lng: c.centre[1], place: c.name, country: c.name, confidence: "country-mentioned" };
    }
  }

  return null;
}

async function collectGdelt() {
  startSource("GDELT", "global-security-events");

  const query = [
    "(war OR missile OR drone OR airstrike OR shelling OR frontline OR terror OR terrorist OR bomb OR explosion OR hostage OR protest OR riot OR coup OR sanction OR airport OR border OR strike OR port OR evacuation OR earthquake OR flood OR wildfire OR tornado OR hurricane OR oil OR gas)",
    "sourcelang:English"
  ].join(" ");

  const url = `https://api.gdeltproject.org/api/v2/doc/doc?query=${encodeURIComponent(query)}&mode=ArtList&format=json&maxrecords=220&sort=DateDesc`;

  try {
    const data = await fetchJson(url, { timeout: 18000 });
    const rows = Array.isArray(data.articles) ? data.articles : [];

    const events = rows.map(a => {
      const title = stripHtml(a.title || "");
      if (!title || !isEnglish(title)) return null;

      const kind = classify(title);
      if (!kind) return null;

      const loc = locate(title);
      if (!loc) return null;

      return {
        id: stableId(`gdelt:${a.url}:${a.seendate}`),
        kind,
        severity: kind === "war" ? 4 : kind === "terror" ? 4 : kind === "crisis" ? 3 : 2,
        title,
        summary: title,
        country: loc.country,
        place: loc.place,
        lat: loc.lat,
        lng: loc.lng,
        source: a.domain || "GDELT",
        sourceSystem: "GDELT",
        url: a.url || "",
        publishedAt: a.seendate || new Date().toISOString(),
        confidence: loc.confidence,
        dataLevel: loc.confidence === "city-mentioned" ? "city-mentioned live event" : "country-mentioned live event"
      };
    }).filter(Boolean);

    markSuccess("GDELT", events.length, "Loaded strict English security/travel events", { url });
    return events;
  } catch (err) {
    markFailure("GDELT", err, { url });
    return [];
  }
}

module.exports = { collectGdelt };
