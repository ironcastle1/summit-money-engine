const { fetchJson, stripHtml } = require("../core/http");
const { stableId } = require("../core/geo");
const { countryMeta, byName } = require("../data/countryMeta");
const citySeeds = require("../data/citySeeds");
const { startSource, markSuccess, markFailure } = require("../core/sourceHealth");

const TERMS = {
  war: ["war", "missile", "drone", "airstrike", "shelling", "frontline", "battle", "troops", "military"],
  terror: ["terror", "terrorist", "bomb", "explosion", "hostage", "gunmen", "attack"],
  politics: ["election", "protest", "riot", "coup", "sanction", "parliament", "government", "minister", "border"],
  movement: ["airport", "border crossing", "rail", "port", "strike", "road closed", "flight cancelled", "evacuation"],
  money: ["bank", "currency", "inflation", "capital controls", "sanctions", "crypto", "payments"],
  crisis: ["earthquake", "flood", "storm", "wildfire", "tornado", "evacuation", "disaster"]
};

function classify(text) {
  const s = String(text || "").toLowerCase();
  for (const [kind, terms] of Object.entries(TERMS)) {
    if (terms.some(t => s.includes(t))) return kind;
  }
  return "security";
}

function isEnglish(text) {
  const s = String(text || "");
  if (!s) return false;
  if (/[\u0400-\u04FF\u0600-\u06FF\u4E00-\u9FFF]/.test(s)) return false;
  const nonAscii = (s.match(/[^\x00-\x7F]/g) || []).length;
  return nonAscii / Math.max(s.length, 1) < 0.08;
}

function locate(title, sourceCountry) {
  const lower = String(title || "").toLowerCase();
  for (const [city, country, lat, lng] of citySeeds) {
    if (lower.includes(city.toLowerCase())) return { lat, lng, place: city, country };
  }
  const row = byName(sourceCountry) || countryMeta.find(c => lower.includes(c.name.toLowerCase()));
  if (row) return { lat: row.centre[0], lng: row.centre[1], place: row.name, country: row.name };
  return { lat: 20, lng: 12, place: "Global", country: "" };
}

async function collectGdelt() {
  startSource("GDELT", "global-security-events");
  const query = `(war OR missile OR drone OR terror OR bomb OR protest OR riot OR coup OR sanction OR airport OR border OR strike OR port OR evacuation OR earthquake OR flood OR storm OR oil OR gas) sourcelang:English`;
  const url = `https://api.gdeltproject.org/api/v2/doc/doc?query=${encodeURIComponent(query)}&mode=ArtList&format=json&maxrecords=180&sort=DateDesc`;
  try {
    const data = await fetchJson(url, { timeout: 18000 });
    const rows = Array.isArray(data.articles) ? data.articles : [];
    const events = rows.map(a => {
      const title = stripHtml(a.title || "");
      if (!title || !isEnglish(title)) return null;
      const sourceCountry = a.sourceCountry || a.sourcecountry || "";
      const loc = locate(`${title} ${a.domain || ""}`, sourceCountry);
      return {
        id: stableId(`gdelt:${a.url}:${a.seendate}`), kind: classify(title), severity: classify(title) === "war" ? 4 : classify(title) === "terror" ? 4 : 2,
        title, summary: title, country: loc.country || sourceCountry, place: loc.place, lat: loc.lat, lng: loc.lng,
        source: a.domain || "GDELT", sourceSystem: "GDELT", url: a.url || "", publishedAt: a.seendate || new Date().toISOString(), confidence: "event-feed"
      };
    }).filter(Boolean);
    markSuccess("GDELT", events.length, "Loaded English security/travel events", { url });
    return events;
  } catch (err) {
    markFailure("GDELT", err, { url });
    return [];
  }
}
module.exports = { collectGdelt };
