const express = require("express");
const axios = require("axios");

const router = express.Router();

const CACHE = new Map();

function getCache(key, maxAgeMs) {
  const item = CACHE.get(key);
  if (!item) return null;
  if (Date.now() - item.time > maxAgeMs) return null;
  return item.value;
}

function setCache(key, value) {
  CACHE.set(key, { time: Date.now(), value });
  return value;
}

function safeNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

async function getJson(url, options = {}) {
  const response = await axios.get(url, {
    timeout: options.timeout || 20000,
    headers: {
      "User-Agent": "SummitMoneyEngine/1.0 contact: local-user",
      "Accept": "application/json",
      ...(options.headers || {})
    }
  });
  return response.data;
}

/**
 * Real country boundaries.
 * This replaces bad hand-made / rough polygon overlays.
 */
router.get("/boundaries/admin0", async (req, res) => {
  try {
    const cached = getCache("admin0-boundaries", 24 * 60 * 60 * 1000);
    if (cached) return res.json(cached);

    const url =
      "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_0_countries.geojson";

    const geojson = await getJson(url, { timeout: 30000 });

    const cleaned = {
      type: "FeatureCollection",
      source: "Natural Earth 1:50m Admin 0 countries",
      note:
        "Country polygons are real Natural Earth boundaries. Some borders may still visually differ from the base map because map tiles and boundary datasets generalise coastlines differently.",
      features: geojson.features.map((f) => ({
        type: "Feature",
        properties: {
          name:
            f.properties.NAME_LONG ||
            f.properties.ADMIN ||
            f.properties.NAME ||
            "Unknown",
          admin: f.properties.ADMIN || f.properties.NAME || "Unknown",
          sovereign:
            f.properties.SOVEREIGNT ||
            f.properties.ADMIN ||
            f.properties.NAME ||
            "Unknown",
          iso2: f.properties.ISO_A2_EH || f.properties.ISO_A2 || "",
          iso3: f.properties.ISO_A3_EH || f.properties.ISO_A3 || "",
          region: f.properties.REGION_UN || "",
          subregion: f.properties.SUBREGION || "",
          economy: f.properties.ECONOMY || "",
          income: f.properties.INCOME_GRP || ""
        },
        geometry: f.geometry
      }))
    };

    res.json(setCache("admin0-boundaries", cleaned));
  } catch (err) {
    res.status(500).json({
      error: "Could not load country boundaries",
      detail: err.message
    });
  }
});

/**
 * Latest available month for UK crime data.
 */
router.get("/crime/uk/latest-month", async (req, res) => {
  try {
    const cached = getCache("police-uk-latest-month", 12 * 60 * 60 * 1000);
    if (cached) return res.json(cached);

    const data = await getJson("https://data.police.uk/api/crime-last-updated");
    res.json(setCache("police-uk-latest-month", data));
  } catch (err) {
    res.status(500).json({
      error: "Could not get latest UK crime month",
      detail: err.message
    });
  }
});

/**
 * Official UK street-level crime tracker.
 * Works for England, Wales and Northern Ireland only.
 */
router.get("/crime/uk", async (req, res) => {
  try {
    const lat = safeNumber(req.query.lat);
    const lng = safeNumber(req.query.lng);
    let date = String(req.query.date || "").trim();

    if (lat === null || lng === null) {
      return res.status(400).json({
        error: "lat and lng are required"
      });
    }

    if (!date) {
      const latest = await getJson("https://data.police.uk/api/crime-last-updated");
      date = latest.date;
    }

    const url =
      "https://data.police.uk/api/crimes-street/all-crime" +
      `?date=${encodeURIComponent(date)}` +
      `&lat=${encodeURIComponent(lat)}` +
      `&lng=${encodeURIComponent(lng)}`;

    const crimes = await getJson(url, { timeout: 30000 });

    const byCategory = {};
    for (const crime of crimes) {
      const key = crime.category || "unknown";
      byCategory[key] = (byCategory[key] || 0) + 1;
    }

    const sortedCategories = Object.entries(byCategory)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);

    res.json({
      source: "data.police.uk",
      coverage: "England, Wales and Northern Ireland only",
      note:
        "Police.uk locations are approximate street-level points, not exact addresses.",
      date,
      lat,
      lng,
      total: crimes.length,
      categories: sortedCategories,
      crimes: crimes.slice(0, 150).map((crime) => ({
        category: crime.category,
        month: crime.month,
        street: crime.location?.street?.name || "Approximate street",
        lat: crime.location?.latitude || null,
        lng: crime.location?.longitude || null,
        outcome:
          crime.outcome_status?.category ||
          "No outcome shown"
      }))
    });
  } catch (err) {
    res.status(500).json({
      error: "Could not load UK crime data",
      detail: err.message
    });
  }
});

/**
 * General point crime check.
 * Real local crime only where an official feed is connected.
 */
router.get("/crime/point", async (req, res) => {
  try {
    const lat = safeNumber(req.query.lat);
    const lng = safeNumber(req.query.lng);

    if (lat === null || lng === null) {
      return res.status(400).json({
        error: "lat and lng are required"
      });
    }

    const latest = await getJson("https://data.police.uk/api/crime-last-updated");
    const date = latest.date;

    const url =
      "https://data.police.uk/api/crimes-street/all-crime" +
      `?date=${encodeURIComponent(date)}` +
      `&lat=${encodeURIComponent(lat)}` +
      `&lng=${encodeURIComponent(lng)}`;

    const crimes = await getJson(url, { timeout: 30000 });

    const byCategory = {};
    for (const crime of crimes) {
      const key = crime.category || "unknown";
      byCategory[key] = (byCategory[key] || 0) + 1;
    }

    const categories = Object.entries(byCategory)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);

    res.json({
      source: "data.police.uk",
      sourceConnected: true,
      localCrimeAvailable: true,
      coverage: "UK street-level crime feed",
      date,
      lat,
      lng,
      total: crimes.length,
      categories,
      status:
        crimes.length === 0
          ? "No crimes returned for this point/month"
          : "Official local crime data found"
    });
  } catch (err) {
    res.json({
      source: null,
      sourceConnected: false,
      localCrimeAvailable: false,
      lat: safeNumber(req.query.lat),
      lng: safeNumber(req.query.lng),
      total: null,
      categories: [],
      status:
        "No official local crime feed connected for this point. Show N/A, not a fake score.",
      detail: err.message
    });
  }
});

/**
 * Wikipedia / Wikimedia place summary with thumbnail.
 */
router.get("/wiki/place", async (req, res) => {
  try {
    const name = String(req.query.name || "").trim();
    const country = String(req.query.country || "").trim();

    if (!name) {
      return res.status(400).json({
        error: "name is required"
      });
    }

    const searchTerm = country ? `${name} ${country}` : name;
    const searchUrl =
      "https://en.wikipedia.org/w/api.php" +
      "?action=query" +
      "&list=search" +
      "&format=json" +
      "&utf8=1" +
      `&srsearch=${encodeURIComponent(searchTerm)}` +
      "&srlimit=1";

    const search = await getJson(searchUrl);

    const hit = search?.query?.search?.[0];
    if (!hit?.title) {
      return res.json({
        found: false,
        title: name,
        thumbnail: null,
        extract: null,
        url: null
      });
    }

    const summaryUrl =
      "https://en.wikipedia.org/api/rest_v1/page/summary/" +
      encodeURIComponent(hit.title);

    const summary = await getJson(summaryUrl);

    res.json({
      found: true,
      title: summary.title || hit.title,
      description: summary.description || "",
      extract: summary.extract || "",
      thumbnail: summary.thumbnail?.source || null,
      originalImage: summary.originalimage?.source || null,
      url: summary.content_urls?.desktop?.page || null,
      source: "Wikipedia / Wikimedia page summary"
    });
  } catch (err) {
    res.status(500).json({
      error: "Could not load Wikipedia place image",
      detail: err.message
    });
  }
});

module.exports = router;
