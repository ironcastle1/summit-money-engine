const { fetchJson, fetchText, stripHtml } = require("../core/http");
const { stableId, centroidFromGeometry, averageLonLat } = require("../core/geo");
const { startSource, markSuccess, markFailure } = require("../core/sourceHealth");

async function collectUSGS() {
  startSource("USGS", "earthquakes");
  const url = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson";
  try {
    const data = await fetchJson(url, { timeout: 12000 });
    const events = (data.features || []).map(f => {
      const p = f.properties || {}, c = f.geometry && f.geometry.coordinates || [];
      return { id: stableId(`usgs:${p.code}:${p.time}`), kind: "crisis", subtype: "earthquake", magnitude: Number(p.mag), severity: Number(p.mag) >= 6 ? 5 : 4, title: p.title || "Earthquake", summary: `${p.mag || "N/A"} magnitude earthquake`, place: p.place || "", country: "", lat: Number(c[1]), lng: Number(c[0]), source: "USGS", sourceSystem: "USGS", url: p.url || "", publishedAt: p.time ? new Date(p.time).toISOString() : null, confidence: "official-feed" };
    }).filter(e => Number.isFinite(e.lat) && Number.isFinite(e.lng) && Number(e.magnitude || 0) >= 5);
    markSuccess("USGS", events.length, "Loaded earthquake feed", { url });
    return events;
  } catch (err) { markFailure("USGS", err, { url }); return []; }
}

async function collectGDACS() {
  startSource("GDACS", "global-disasters");
  const url = "https://www.gdacs.org/xml/rss.xml";
  try {
    const xml = await fetchText(url, { timeout: 12000 });
    const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map(m => m[1]);
    const events = items.map(item => {
      const title = stripHtml(((item.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/) || item.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || "Disaster alert"));
      const link = stripHtml((item.match(/<link>([\s\S]*?)<\/link>/) || [])[1] || "");
      const desc = stripHtml(((item.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/) || item.match(/<description>([\s\S]*?)<\/description>/) || [])[1] || title));
      const point = item.match(/<georss:point>([-\d.]+)\s+([-\d.]+)<\/georss:point>/);
      return { id: stableId(`gdacs:${title}:${link}`), kind: "crisis", subtype: "disaster", severity: 4, title, summary: desc, place: title, country: "", lat: point ? Number(point[1]) : null, lng: point ? Number(point[2]) : null, source: "GDACS", sourceSystem: "GDACS", url: link, publishedAt: null, confidence: "official-disaster-feed" };
    }).filter(e => Number.isFinite(e.lat) && Number.isFinite(e.lng));
    markSuccess("GDACS", events.length, "Loaded global disaster RSS", { url });
    return events;
  } catch (err) { markFailure("GDACS", err, { url }); return []; }
}

function eonetPoint(geoms) {
  const g = Array.isArray(geoms) && geoms.length ? geoms[geoms.length - 1] : null;
  if (!g) return null;
  if (g.type === "Point" && Array.isArray(g.coordinates)) return { lng: Number(g.coordinates[0]), lat: Number(g.coordinates[1]) };
  if (g.type === "Polygon") return averageLonLat(g.coordinates && g.coordinates[0] || []);
  return null;
}
async function collectEONET() {
  startSource("NASA EONET", "natural-hazards");
  const url = "https://eonet.gsfc.nasa.gov/api/v3/events?status=open&limit=120";
  try {
    const data = await fetchJson(url, { timeout: 14000 });
    const events = (data.events || []).map(e => {
      const p = eonetPoint(e.geometry); if (!p) return null;
      const cat = Array.isArray(e.categories) && e.categories[0] ? e.categories[0].title : "Natural hazard";
      return { id: stableId(`eonet:${e.id}`), kind: "crisis", subtype: cat, severity: 3, title: `${cat}: ${e.title || "hazard"}`, summary: e.title || cat, place: e.title || cat, country: "", lat: p.lat, lng: p.lng, source: "NASA EONET", sourceSystem: "NASA EONET", url: e.link || "", publishedAt: null, confidence: "official-hazard-feed" };
    }).filter(Boolean);
    markSuccess("NASA EONET", events.length, "Loaded open natural hazards", { url }); return events;
  } catch (err) { markFailure("NASA EONET", err, { url }); return []; }
}

async function collectNWS() {
  startSource("US NWS", "severe-weather");
  const url = "https://api.weather.gov/alerts/active?status=actual&message_type=alert";
  try {
    const data = await fetchJson(url, { timeout: 14000, headers: { Accept: "application/geo+json,application/json" } });
    const allowed = /Tornado|Severe Thunderstorm|Flash Flood|Flood Warning|Hurricane|Tropical Storm|Wildfire|Evacuation|Extreme Wind|Blizzard|Winter Storm/i;
    const blocked = /Marine|Small Craft|Beach|Rip Current|Lake|Gale|Surf|Dense Fog|Air Quality/i;
    const events = (data.features || []).map(f => {
      const p = f.properties || {};
      const eventName = String(p.event || "Weather alert");
      const titleText = `${eventName} - ${p.areaDesc || ""}`;
      if (!allowed.test(eventName) || blocked.test(titleText)) return null;
      const c = centroidFromGeometry(f.geometry); if (!c) return null;
      return { id: stableId(`nws:${p.id}:${p.sent}`), kind: "crisis", subtype: "weather-alert", severity: p.severity === "Extreme" || p.severity === "Severe" ? 4 : 2, title: titleText, summary: stripHtml(p.headline || p.description || "Weather alert").slice(0, 360), place: p.areaDesc || "United States", country: "United States", lat: c.lat, lng: c.lng, source: "US National Weather Service", sourceSystem: "NWS", url: p.uri || "", publishedAt: p.sent || p.effective, confidence: "official-alert" };
    }).filter(Boolean);
    markSuccess("US NWS", events.length, "Loaded active weather alerts", { url }); return events;
  } catch (err) { markFailure("US NWS", err, { url }); return []; }
}
module.exports = { collectUSGS, collectGDACS, collectEONET, collectNWS };
