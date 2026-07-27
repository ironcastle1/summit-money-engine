const { fetchJson } = require("../core/http");
const cache = require("../core/cacheStore");
const { bboxAround } = require("../core/geo");
const { startSource, markSuccess, markFailure } = require("../core/sourceHealth");

const TTL = { reverse: 6 * 60 * 60 * 1000, wiki: 24 * 60 * 60 * 1000, infra: 20 * 60 * 1000 };

async function reverseGeocode(lat, lng) {
  const key = `reverse:${Number(lat).toFixed(5)}:${Number(lng).toFixed(5)}`;
  const cached = cache.get(key); if (cached) return cached;
  startSource("Nominatim reverse", "place-resolution");
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}&addressdetails=1&zoom=18&accept-language=en`;
  try {
    const data = await fetchJson(url, { timeout: 10000 });
    const a = data.address || {};
    const result = { displayName: data.display_name || "", name: data.name || a.neighbourhood || a.suburb || a.city || a.town || a.village || a.hamlet || "", country: a.country || "", countryCode: a.country_code ? String(a.country_code).toUpperCase() : null, city: a.city || a.town || a.village || a.hamlet || "", county: a.county || "", state: a.state || "", raw: a, source: "Nominatim/OpenStreetMap" };
    markSuccess("Nominatim reverse", 1, "Resolved clicked place", { url: "nominatim reverse" });
    return cache.set(key, result, TTL.reverse);
  } catch (err) { markFailure("Nominatim reverse", err); return { displayName: "", country: "", countryCode: null, raw: {}, source: "Nominatim failed" }; }
}

async function searchPlaces(q) {
  startSource("Nominatim search", "place-search");
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(q)}&limit=8&addressdetails=1&accept-language=en`;
  try {
    const rows = await fetchJson(url, { timeout: 10000 });
    const places = (rows || []).map(r => ({ name: r.name || r.display_name, displayName: r.display_name, lat: Number(r.lat), lng: Number(r.lon), raw: r.address || {}, source: "Nominatim/OpenStreetMap" })).filter(p => Number.isFinite(p.lat) && Number.isFinite(p.lng));
    markSuccess("Nominatim search", places.length, "Search completed");
    return places;
  } catch (err) { markFailure("Nominatim search", err); return []; }
}

async function nearbyInfrastructure(lat, lng, km = 4) {
  const bbox = bboxAround(lat, lng, km);
  const key = `infra:${bbox.south.toFixed(3)}:${bbox.west.toFixed(3)}:${bbox.north.toFixed(3)}:${bbox.east.toFixed(3)}`;
  const cached = cache.get(key); if (cached) return cached;
  startSource("Overpass infrastructure", "local-infrastructure");
  const query = `
    [out:json][timeout:16];
    (
      node["amenity"~"hospital|clinic|doctors|police|fire_station|pharmacy|fuel|embassy|bank|bureau_de_change"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});
      node["emergency"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});
      node["public_transport"="station"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});
      node["railway"="station"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});
      node["aeroway"="aerodrome"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});
      node["harbour"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});
      node["man_made"="surveillance"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});
      node["place"~"city|town|village|suburb|hamlet|neighbourhood"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});
    );
    out center 220;
  `;
  const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;
  try {
    const data = await fetchJson(url, { timeout: 18000 });
    const items = (data.elements || []).map(el => ({ id: el.id, name: (el.tags && (el.tags["name:en"] || el.tags.name)) || "Unnamed", lat: el.lat, lng: el.lon, type: el.tags && (el.tags.amenity || el.tags.emergency || el.tags.railway || el.tags.public_transport || el.tags.aeroway || el.tags.place || "infrastructure") || "infrastructure", tags: el.tags || {}, source: "OpenStreetMap/Overpass" })).filter(i => Number.isFinite(i.lat) && Number.isFinite(i.lng));
    const result = { items, counts: countBy(items, "type"), source: "OpenStreetMap/Overpass", radiusKm: km };
    markSuccess("Overpass infrastructure", items.length, "Loaded nearby infrastructure");
    return cache.set(key, result, TTL.infra);
  } catch (err) { markFailure("Overpass infrastructure", err); return { items: [], counts: {}, source: "Overpass failed", radiusKm: km }; }
}

function countBy(rows, key) { return rows.reduce((acc, row) => { const v = row[key] || "unknown"; acc[v] = (acc[v] || 0) + 1; return acc; }, {}); }

async function wikiPlace(name) {
  const clean = String(name || "").replace(/\s+/g, " ").trim();
  if (!clean) return { found: false };
  const key = `wiki:${clean.toLowerCase()}`; const cached = cache.get(key); if (cached) return cached;
  startSource("Wikipedia", "place-images");
  try {
    const search = await fetchJson(`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(clean)}&format=json&origin=*&srlimit=1`, { timeout: 10000 });
    const first = search.query && search.query.search && search.query.search[0];
    if (!first) { markSuccess("Wikipedia", 0, "No image match"); return cache.set(key, { found: false }, TTL.wiki); }
    const summary = await fetchJson(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(first.title)}?redirect=true`, { timeout: 10000 });
    const result = { found: true, title: summary.title || first.title, extract: summary.extract || "", thumbnail: summary.thumbnail && summary.thumbnail.source || null, url: summary.content_urls && summary.content_urls.desktop && summary.content_urls.desktop.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(first.title.replace(/ /g, "_"))}`, source: "Wikipedia" };
    markSuccess("Wikipedia", result.thumbnail ? 1 : 0, "Loaded place summary/image");
    return cache.set(key, result, TTL.wiki);
  } catch (err) { markFailure("Wikipedia", err); return cache.set(key, { found: false, error: err.message }, 30 * 60 * 1000); }
}

module.exports = { reverseGeocode, searchPlaces, nearbyInfrastructure, wikiPlace };
