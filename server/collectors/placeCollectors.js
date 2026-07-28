const { fetchJson } = require("../core/http");
const cache = require("../core/cacheStore");
const { bboxAround, haversineKm } = require("../core/geo");
const { startSource, markSuccess, markFailure } = require("../core/sourceHealth");
const citySeeds = require("../data/citySeeds");
const { byIso, countryMeta } = require("../data/countryMeta");

const SEARCH_ALIASES = { damscus: 'damascus', damas: 'damascus', 'old city damascus': 'Old City, Damascus', 'telaviv': 'Tel Aviv' };

const TTL = {
  reverse: 6 * 60 * 60 * 1000,
  search: 6 * 60 * 60 * 1000,
  wiki: 24 * 60 * 60 * 1000,
  infra: 20 * 60 * 1000
};

function clean(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function number(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function elementLatLng(element) {
  const lat = number(element.lat || (element.center && element.center.lat));
  const lng = number(element.lon || (element.center && element.center.lon));
  if (lat === null || lng === null) return null;
  return { lat, lng };
}

function classifyInfrastructure(tags = {}) {
  const amenity = tags.amenity || "";
  const emergency = tags.emergency || "";
  const railway = tags.railway || "";
  const publicTransport = tags.public_transport || "";
  const aeroway = tags.aeroway || "";
  const highway = tags.highway || "";
  const borderControl = tags.border_control || tags.barrier || tags.checkpoint || "";
  const diplomatic = tags.diplomatic || "";
  const harbour = tags.harbour || tags.port || tags.seamark || "";
  const healthcare = tags.healthcare || "";
  const manMade = tags.man_made || "";
  const towerType = tags["tower:type"] || "";
  const shop = tags.shop || "";
  const power = tags.power || "";

  if (["hospital"].includes(amenity) || emergency === "hospital" || healthcare === "hospital") return "hospital";
  if (["clinic", "doctors", "dentist"].includes(amenity) || ["clinic", "doctor", "doctors"].includes(healthcare)) return "clinic";
  if (amenity === "pharmacy" || healthcare === "pharmacy") return "pharmacy";
  if (amenity === "police") return "police_station";
  if (amenity === "fire_station") return "fire_station";
  if (amenity === "embassy" || diplomatic === "embassy" || diplomatic === "consulate") return "embassy_consulate";
  if (amenity === "fuel") return "fuel_station";
  if (aeroway === "aerodrome" || aeroway === "terminal") return "airport_airfield";
  if (railway === "station" || publicTransport === "station") return "rail_station";
  if (harbour || tags["seamark:type"] === "harbour" || amenity === "ferry_terminal") return "port_harbour";
  if (borderControl || highway === "border_control") return "border_crossing";
  if (["motorway", "trunk", "primary", "secondary"].includes(highway)) return "main_road";
  if (amenity === "bank" || amenity === "bureau_de_change") return "money_service";
  if (amenity === "drinking_water") return "water_point";
  if (amenity === "shelter") return "shelter";
  if (["supermarket", "convenience", "general"].includes(shop)) return "food_supply";
  if (manMade === "communications_tower" || manMade === "mast" || towerType === "communication") return "communications";
  if (["substation", "generator", "line", "plant"].includes(power)) return "power_infrastructure";
  if (tags.place) return "place";
  return amenity || emergency || railway || publicTransport || aeroway || highway || "infrastructure";
}

function infrastructurePriority(type) {
  const order = {
    hospital: 1,
    clinic: 2,
    pharmacy: 3,
    police_station: 4,
    fire_station: 5,
    embassy_consulate: 6,
    airport_airfield: 7,
    fuel_station: 8,
    border_crossing: 9,
    port_harbour: 10,
    rail_station: 11,
    main_road: 12,
    money_service: 13,
    communications: 14,
    water_point: 15,
    shelter: 16,
    food_supply: 17,
    power_infrastructure: 18,
    place: 50
  };
  return order[type] || 40;
}

function fallbackPlaceFromCoords(lat, lng) {
  let nearest = null;
  for (const [name, country, clat, clng] of citySeeds) {
    const d = haversineKm(Number(lat), Number(lng), Number(clat), Number(clng));
    if (Number.isFinite(d) && (!nearest || d < nearest.distanceKm)) nearest = { name, country, lat: clat, lng: clng, distanceKm: d };
  }
  if (nearest && nearest.distanceKm <= 160) {
    const meta = countryMeta.find(c => c.name === nearest.country);
    return {
      displayName: `${nearest.name}, ${nearest.country}`,
      name: nearest.name,
      road: "",
      suburb: "",
      country: nearest.country,
      countryCode: meta ? meta.iso2 : null,
      city: nearest.name,
      county: "",
      state: "",
      raw: { city: nearest.name, country: nearest.country, estimatedFromNearestMappedCity: true },
      source: "Fallback from nearest mapped city"
    };
  }
  return null;
}

async function reverseGeocode(lat, lng) {
  const key = `reverse:${Number(lat).toFixed(5)}:${Number(lng).toFixed(5)}`;
  const cached = cache.get(key);
  if (cached) return cached;

  startSource("Nominatim reverse", "place-resolution");
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}&addressdetails=1&zoom=16&accept-language=en`;

  try {
    const data = await fetchJson(url, { timeout: 10000 });
    const a = data.address || {};
    const result = {
      displayName: data.display_name || "",
      name: data.name || a.neighbourhood || a.suburb || a.city || a.town || a.village || a.hamlet || a.road || "",
      road: a.road || "",
      suburb: a.suburb || a.neighbourhood || "",
      country: a.country || "",
      countryCode: a.country_code ? String(a.country_code).toUpperCase() : null,
      city: a.city || a.town || a.village || a.hamlet || "",
      county: a.county || "",
      state: a.state || "",
      raw: a,
      source: "Nominatim/OpenStreetMap"
    };
    if (!result.country && !result.countryCode) {
      const fallback = fallbackPlaceFromCoords(lat, lng);
      if (fallback) {
        markSuccess("Nominatim reverse", 1, "Resolved clicked place using nearest mapped-city fallback", { url: "nominatim reverse" });
        return cache.set(key, fallback, TTL.reverse);
      }
    }
    markSuccess("Nominatim reverse", 1, "Resolved clicked place", { url: "nominatim reverse" });
    return cache.set(key, result, TTL.reverse);
  } catch (err) {
    markFailure("Nominatim reverse", err);
    return { displayName: "", country: "", countryCode: null, raw: {}, source: "Nominatim failed" };
  }
}


function normaliseSearchText(value) {
  return clean(value)
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/\s*,\s*/g, ",")
    .replace(/\s+/g, " ");
}

function citySeedFallback(query) {
  const q = normaliseSearchText(query);
  if (!q) return [];

  const pieces = q.split(",").map(x => x.trim()).filter(Boolean);
  const main = pieces[0] || q;

  const rows = citySeeds.map(row => {
    const [name, country, lat, lng] = row;
    const city = normaliseSearchText(name);
    const nation = normaliseSearchText(country);
    const full = `${city}, ${nation}`;

    let score = 0;
    if (q === city || q === full || main === city) score = 100;
    else if (q.includes(city) && q.includes(nation)) score = 90;
    else if (city.includes(q) || q.includes(city)) score = 75;
    else if (main && (city.includes(main) || main.includes(city))) score = 65;

    return { row, score };
  })
    .filter(x => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);

  return rows.map(({ row }) => {
    const [name, country, lat, lng] = row;
    return {
      name,
      displayName: `${name}, ${country}`,
      lat: Number(lat),
      lng: Number(lng),
      raw: { city: name, country },
      source: "Built-in city fallback"
    };
  });
}

async function searchPlaces(q) {
  let query = clean(q);
  const aliasKey = query.toLowerCase().trim();
  if (SEARCH_ALIASES[aliasKey]) query = SEARCH_ALIASES[aliasKey];
  if (!query) return [];

  const key = `search:${query.toLowerCase()}`;
  const cached = cache.get(key);
  if (cached) return cached;

  const fallback = citySeedFallback(query);

  startSource("Nominatim search", "place-search");
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(query)}&limit=8&addressdetails=1&accept-language=en`;

  try {
    const rows = await fetchJson(url, { timeout: 10000 });
    const nominatimPlaces = (rows || [])
      .map(r => ({
        name: r.name || r.display_name,
        displayName: r.display_name,
        lat: Number(r.lat),
        lng: Number(r.lon),
        raw: r.address || {},
        source: "Nominatim/OpenStreetMap"
      }))
      .filter(p => Number.isFinite(p.lat) && Number.isFinite(p.lng));

    const merged = mergePlaces(nominatimPlaces, fallback);
    markSuccess("Nominatim search", merged.length, fallback.length ? "Search completed with built-in city fallback available" : "Search completed");
    return cache.set(key, merged, TTL.search);
  } catch (err) {
    markFailure("Nominatim search", err);

    if (fallback.length) {
      markSuccess("Built-in city fallback", fallback.length, `Matched ${query} without external geocoder`);
      return cache.set(key, fallback, TTL.search);
    }

    return cache.set(key, [], 2 * 60 * 1000);
  }
}

function mergePlaces(primary, fallback) {
  const seen = new Set();
  const out = [];
  for (const place of [...fallback, ...primary]) {
    const key = `${Number(place.lat).toFixed(4)}:${Number(place.lng).toFixed(4)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(place);
  }
  return out;
}

async function nearbyInfrastructure(lat, lng, km = 4) {
  const safeKm = Math.max(0.5, Math.min(80, Number(km) || 4));
  const bbox = bboxAround(lat, lng, safeKm);
  const key = `infra:${Number(lat).toFixed(3)}:${Number(lng).toFixed(3)}:${safeKm.toFixed(1)}`;
  const cached = cache.get(key);
  if (cached) return cached;

  startSource("Overpass infrastructure", "local-infrastructure");

  const query = `
    [out:json][timeout:8];
    (
      nwr["amenity"~"hospital|clinic|doctors|dentist|pharmacy|police|fire_station|embassy|fuel|ferry_terminal|bank|bureau_de_change|drinking_water|shelter"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});
      nwr["healthcare"~"hospital|clinic|doctor|doctors|pharmacy"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});
      nwr["emergency"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});
      nwr["diplomatic"~"embassy|consulate"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});
      nwr["public_transport"="station"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});
      nwr["railway"="station"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});
      nwr["aeroway"~"aerodrome|terminal"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});
      nwr["harbour"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});
      nwr["port"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});
      nwr["border_control"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});
      nwr["barrier"="border_control"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});
      nwr["checkpoint"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});
      nwr["shop"~"supermarket|convenience|general"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});
      nwr["man_made"~"communications_tower|mast"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});
      nwr["tower:type"="communication"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});
      nwr["power"~"substation|generator|plant"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});
      way["highway"~"motorway|trunk|primary|secondary"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});
    );
    out center 900;
  `;

  const endpoints = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
    "https://overpass.openstreetmap.ru/api/interpreter"
  ];

  try {
    let data = null;
    let lastErr = null;
    for (const endpoint of endpoints) {
      try {
        data = await fetchJson(`${endpoint}?data=${encodeURIComponent(query)}`, { timeout: 9000 });
        if (data && Array.isArray(data.elements)) break;
      } catch (err) { lastErr = err; }
    }
    if (!data || !Array.isArray(data.elements)) throw lastErr || new Error("Overpass returned no elements array");
    const dedupe = new Map();

    for (const el of data.elements || []) {
      const point = elementLatLng(el);
      if (!point) continue;
      const tags = el.tags || {};
      const type = classifyInfrastructure(tags);
      const distanceKm = haversineKm(lat, lng, point.lat, point.lng);
      if (!Number.isFinite(distanceKm) || distanceKm > safeKm * 1.12) continue;
      const name = clean(tags["name:en"] || tags.name || tags.ref || type.replace(/_/g, " "));
      const id = `${el.type || "node"}:${el.id}:${type}`;
      if (dedupe.has(id)) continue;
      dedupe.set(id, {
        id,
        name,
        lat: point.lat,
        lng: point.lng,
        type,
        distanceKm,
        distanceMiles: distanceKm * 0.621371,
        tags,
        source: "OpenStreetMap/Overpass"
      });
    }

    const items = [...dedupe.values()].sort((a, b) => {
      const p = infrastructurePriority(a.type) - infrastructurePriority(b.type);
      return p || a.distanceKm - b.distanceKm;
    });

    const counts = countBy(items, "type");
    const nearestByType = {};
    for (const item of items) if (!nearestByType[item.type]) nearestByType[item.type] = item;

    const result = { items, counts, nearestByType, source: "OpenStreetMap/Overpass", radiusKm: safeKm, radiusMiles: safeKm * 0.621371 };
    markSuccess("Overpass infrastructure", items.length, "Loaded radius emergency infrastructure");
    return cache.set(key, result, TTL.infra);
  } catch (err) {
    markFailure("Overpass infrastructure", err);
    return { items: [], counts: {}, nearestByType: {}, source: "Overpass failed", radiusKm: safeKm, radiusMiles: safeKm * 0.621371, error: err.message };
  }
}

function countBy(rows, key) {
  return rows.reduce((acc, row) => {
    const v = row[key] || "unknown";
    acc[v] = (acc[v] || 0) + 1;
    return acc;
  }, {});
}

async function wikiPlace(name) {
  const query = clean(name);
  if (!query) return { found: false };

  const key = `wiki:${query.toLowerCase()}`;
  const cached = cache.get(key);
  if (cached) return cached;

  startSource("Wikipedia", "place-images");

  function candidatesFor(q) {
    const parts = q.split(",").map(x => clean(x)).filter(Boolean);
    const isRoadish = value => /^(road|street|lane|avenue|avenida|d\s*\d+|a\s*\d+|m\s*\d+|b\s*\d+)/i.test(value || "");
    const out = [];
    if (parts.length >= 2 && !isRoadish(parts[0])) out.push(`${parts[0]}, ${parts[parts.length - 1]}`);
    if (parts.length >= 3 && !isRoadish(parts[1])) out.push(`${parts[1]}, ${parts[parts.length - 1]}`);
    for (const part of parts) if (part && !isRoadish(part)) out.push(part);
    out.push(q);
    return [...new Set(out.filter(Boolean))].slice(0, 6);
  }

  async function summaryFor(title) {
    const summary = await fetchJson(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}?redirect=true`, { timeout: 10000 });
    let thumb = summary.thumbnail && summary.thumbnail.source || null;
    if (!thumb) {
      try {
        const images = await fetchJson(`https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(summary.title || title)}&prop=pageimages&pithumbsize=700&format=json&origin=*`, { timeout: 10000 });
        const pages = images.query && images.query.pages || {};
        const first = Object.values(pages)[0];
        thumb = first && first.thumbnail && first.thumbnail.source || null;
      } catch {}
    }
    return {
      found: true,
      title: summary.title || title,
      extract: summary.extract || "",
      thumbnail: thumb,
      url: summary.content_urls && summary.content_urls.desktop && summary.content_urls.desktop.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(String(title).replace(/ /g, "_"))}`,
      source: "Wikipedia/Wikimedia",
      lookup: title
    };
  }

  try {
    for (const q of candidatesFor(query)) {
      const search = await fetchJson(`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(q)}&format=json&origin=*&srlimit=3`, { timeout: 10000 });
      const rows = search.query && search.query.search || [];
      for (const row of rows) {
        if (!row || !row.title) continue;
        const result = await summaryFor(row.title);
        if (result && (result.thumbnail || result.extract)) {
          markSuccess("Wikipedia", result.thumbnail ? 1 : 0, "Loaded place summary/image with fallback search");
          return cache.set(key, result, TTL.wiki);
        }
      }
    }
    markSuccess("Wikipedia", 0, "No image match after fallback search");
    return cache.set(key, { found: false }, TTL.wiki);
  } catch (err) {
    markFailure("Wikipedia", err);
    return cache.set(key, { found: false, error: err.message }, 30 * 60 * 1000);
  }
}

module.exports = { reverseGeocode, searchPlaces, nearbyInfrastructure, wikiPlace, classifyInfrastructure };
