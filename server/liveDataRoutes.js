const express = require("express");
const axios = require("axios");

const router = express.Router();
const CACHE = new Map();

const WB = {
  homicide: "VC.IHR.PSRC.P5",
  gdpPerPerson: "NY.GDP.PCAP.CD",
  gdpGrowth: "NY.GDP.MKTP.KD.ZG",
  inflation: "FP.CPI.TOTL.ZG",
  unemployment: "SL.UEM.TOTL.ZS",
  tradeGdp: "NE.TRD.GNFS.ZS",
  internet: "IT.NET.USER.ZS",
  population: "SP.POP.TOTL"
};

const BASELINE = {
  RU: { war: 75, politics: 60, crisis: 35, note: "major war/sanctions state" },
  UA: { war: 95, politics: 70, crisis: 55, note: "active major war" },
  SY: { war: 90, politics: 70, crisis: 55, note: "active conflict and state fragility" },
  YE: { war: 90, politics: 70, crisis: 65, note: "active conflict and humanitarian crisis" },
  SD: { war: 95, politics: 75, crisis: 75, note: "active civil war/humanitarian crisis" },
  MM: { war: 80, politics: 75, crisis: 55, note: "active civil conflict" },
  AF: { war: 70, politics: 75, crisis: 55, note: "high conflict/political risk" },
  IL: { war: 65, politics: 60, crisis: 45, note: "regional conflict exposure" },
  PS: { war: 90, politics: 75, crisis: 80, note: "active conflict/humanitarian crisis" },
  LB: { war: 65, politics: 75, crisis: 50, note: "regional conflict/political risk" },
  IR: { war: 45, politics: 75, crisis: 45, note: "sanctions/geopolitical risk" },
  KP: { war: 45, politics: 85, crisis: 40, note: "closed state/geopolitical risk" },
  HT: { war: 55, politics: 85, crisis: 80, note: "gang violence and state fragility" },
  ML: { war: 70, politics: 75, crisis: 60, note: "Sahel insurgency/state fragility" },
  BF: { war: 75, politics: 75, crisis: 65, note: "Sahel insurgency/state fragility" },
  NE: { war: 60, politics: 70, crisis: 55, note: "Sahel instability" },
  SO: { war: 75, politics: 70, crisis: 70, note: "insurgency and fragility" }
};

function cacheGet(key, maxAgeMs) {
  const hit = CACHE.get(key);
  if (!hit) return null;
  if (Date.now() - hit.time > maxAgeMs) {
    CACHE.delete(key);
    return null;
  }
  return hit.value;
}

function cacheSet(key, value) {
  CACHE.set(key, { time: Date.now(), value });
  return value;
}

function num(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function iso2(value) {
  const v = String(value || "").trim().toUpperCase();
  if (!v || v.length !== 2) return null;
  return v === "UK" ? "GB" : v;
}

function clean(value, max = 500) {
  return String(value || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

async function getJson(url, options = {}) {
  const res = await axios.get(url, {
    timeout: options.timeout || 20000,
    headers: {
      "User-Agent": "SummitMoneyEngine/1.0",
      Accept: "application/json",
      ...(options.headers || {})
    }
  });
  return res.data;
}

async function getText(url, options = {}) {
  const res = await axios.get(url, {
    timeout: options.timeout || 20000,
    headers: {
      "User-Agent": "SummitMoneyEngine/1.0",
      Accept: options.accept || "text/plain, text/xml, application/xml, */*",
      ...(options.headers || {})
    }
  });
  return String(res.data || "");
}

async function reverseLookup(lat, lng) {
  const key = `reverse:${Number(lat).toFixed(3)}:${Number(lng).toFixed(3)}`;
  const cached = cacheGet(key, 24 * 60 * 60 * 1000);
  if (cached) return cached;

  const url =
    "https://nominatim.openstreetmap.org/reverse" +
    `?format=jsonv2&lat=${encodeURIComponent(lat)}` +
    `&lon=${encodeURIComponent(lng)}` +
    "&zoom=10&addressdetails=1&accept-language=en";

  const data = await getJson(url, { timeout: 15000 });
  const a = data.address || {};

  return cacheSet(key, {
    displayName: data.display_name || "",
    city: a.city || a.town || a.village || a.hamlet || a.county || "",
    state: a.state || a.region || "",
    country: a.country || "",
    countryCode: iso2(a.country_code),
    raw: a
  });
}

async function wbLatest(countryCode, indicator) {
  const code = iso2(countryCode);
  if (!code) return null;

  const key = `wb:${code}:${indicator}`;
  const cached = cacheGet(key, 7 * 24 * 60 * 60 * 1000);
  if (cached !== null) return cached;

  try {
    const url =
      `https://api.worldbank.org/v2/country/${encodeURIComponent(code)}` +
      `/indicator/${encodeURIComponent(indicator)}` +
      "?format=json&per_page=12";

    const data = await getJson(url, { timeout: 20000 });
    const rows = Array.isArray(data?.[1]) ? data[1] : [];
    const hit = rows.find((r) => r.value !== null && r.value !== undefined);

    return cacheSet(
      key,
      hit
        ? {
            value: num(hit.value),
            year: hit.date || null,
            indicator,
            source: "World Bank"
          }
        : null
    );
  } catch {
    return cacheSet(key, null);
  }
}

async function worldBankBundle(countryCode) {
  const code = iso2(countryCode);
  if (!code) return null;

  const [
    homicide,
    gdpPerPerson,
    gdpGrowth,
    inflation,
    unemployment,
    tradeGdp,
    internet,
    population
  ] = await Promise.all([
    wbLatest(code, WB.homicide),
    wbLatest(code, WB.gdpPerPerson),
    wbLatest(code, WB.gdpGrowth),
    wbLatest(code, WB.inflation),
    wbLatest(code, WB.unemployment),
    wbLatest(code, WB.tradeGdp),
    wbLatest(code, WB.internet),
    wbLatest(code, WB.population)
  ]);

  return {
    countryCode: code,
    homicide,
    gdpPerPerson,
    gdpGrowth,
    inflation,
    unemployment,
    tradeGdp,
    internet,
    population
  };
}

function crimeScoreFromHomicide(homicide) {
  if (!homicide || homicide.value === null || homicide.value === undefined) {
    return {
      score: null,
      status: "No national data",
      reason: "No World Bank homicide indicator"
    };
  }

  const v = Number(homicide.value);
  let score = 85;

  if (v >= 25) score = 15;
  else if (v >= 15) score = 28;
  else if (v >= 8) score = 42;
  else if (v >= 4) score = 58;
  else if (v >= 2) score = 72;
  else score = 88;

  return {
    score,
    status:
      score >= 75
        ? "Lower crime signal"
        : score >= 55
        ? "Caution"
        : score >= 35
        ? "High crime signal"
        : "Severe crime signal",
    reason: `${v.toFixed(1)} homicides per 100k, ${homicide.year || "year N/A"}`
  };
}

function moneyScore(bundle) {
  if (!bundle) {
    return {
      score: null,
      status: "No macro data",
      reason: "World Bank unavailable"
    };
  }

  let score = 50;
  const reasons = [];

  if (bundle.gdpGrowth?.value !== null && bundle.gdpGrowth?.value !== undefined) {
    const v = Number(bundle.gdpGrowth.value);
    if (v >= 5) {
      score += 18;
      reasons.push("strong growth");
    } else if (v >= 2) {
      score += 8;
      reasons.push("positive growth");
    } else if (v < 0) {
      score -= 18;
      reasons.push("shrinking GDP");
    }
  }

  if (bundle.inflation?.value !== null && bundle.inflation?.value !== undefined) {
    const v = Number(bundle.inflation.value);
    if (v > 15) {
      score -= 22;
      reasons.push("very high inflation");
    } else if (v > 8) {
      score -= 12;
      reasons.push("high inflation");
    } else if (v >= 0 && v <= 4) {
      score += 8;
      reasons.push("controlled inflation");
    }
  }

  if (bundle.unemployment?.value !== null && bundle.unemployment?.value !== undefined) {
    const v = Number(bundle.unemployment.value);
    if (v > 12) {
      score -= 10;
      reasons.push("high unemployment");
    } else if (v < 5) {
      score += 5;
      reasons.push("low unemployment");
    }
  }

  if (bundle.tradeGdp?.value !== null && bundle.tradeGdp?.value !== undefined) {
    if (Number(bundle.tradeGdp.value) > 70) {
      score += 8;
      reasons.push("trade-heavy");
    }
  }

  score = Math.max(0, Math.min(100, Math.round(score)));

  return {
    score,
    status: score >= 70 ? "Stronger" : score >= 45 ? "Mixed" : "Weaker",
    reason: reasons.length ? reasons.join(", ") : "limited macro signal"
  };
}

function englishFallback(topic, place) {
  return `${topic} report near ${place || "selected area"}`;
}

async function gdeltArticles(query, maxRecords = 30, topic = "News") {
  const key = `gdelt:${query}:${maxRecords}:${topic}`;
  const cached = cacheGet(key, 15 * 60 * 1000);
  if (cached) return cached;

  try {
    const url =
      "https://api.gdeltproject.org/api/v2/doc/doc" +
      `?query=${encodeURIComponent(query)}` +
      "&mode=ArtList" +
      "&format=json" +
      `&maxrecords=${encodeURIComponent(maxRecords)}` +
      "&sort=HybridRel";

    const data = await getJson(url, { timeout: 25000 });
    const articles = Array.isArray(data.articles) ? data.articles : [];

    return cacheSet(
      key,
      articles.map((a) => {
        const rawTitle = clean(a.title, 180);
        const lang = String(a.language || "").toLowerCase();
        const isEnglish = !lang || lang === "english" || lang === "en";

        return {
          title: isEnglish ? rawTitle : englishFallback(topic, a.sourceCountry || ""),
          originalTitle: isEnglish ? "" : rawTitle,
          url: a.url || "",
          source: a.domain || a.source || "GDELT",
          sourceCountry: a.sourceCountry || "",
          language: a.language || "",
          seenDate: a.seendate || "",
          topic
        };
      })
    );
  } catch {
    return cacheSet(key, []);
  }
}

async function gdeltBundle(countryName, cityName) {
  const country = countryName ? `"${countryName}"` : "global";
  const local = cityName ? `"${cityName}" "${countryName}"` : country;

  const [war, politics, terror, localNews] = await Promise.all([
    gdeltArticles(`${country} (war OR missile OR drone OR shelling OR battle OR invasion OR clashes OR military)`, 25, "War"),
    gdeltArticles(`${country} (election OR protest OR coup OR sanctions OR parliament OR unrest OR government)`, 25, "Politics"),
    gdeltArticles(`${country} (terror OR terrorist OR bombing OR attack OR extremist OR insurgent)`, 25, "Terror"),
    gdeltArticles(`${local}`, 20, "Local news")
  ]);

  return { war, politics, terror, localNews };
}

async function gdacsDisasters() {
  const key = "gdacs:rss";
  const cached = cacheGet(key, 10 * 60 * 1000);
  if (cached) return cached;

  try {
    const xml = await getText("https://www.gdacs.org/xml/rss.xml", {
      timeout: 25000,
      accept: "application/rss+xml, text/xml, application/xml"
    });

    const items = [];
    const matches = xml.match(/<item[\s\S]*?<\/item>/gi) || [];

    for (const item of matches.slice(0, 80)) {
      const title = clean((item.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/i) || item.match(/<title>([\s\S]*?)<\/title>/i) || [])[1], 180);
      const url = clean((item.match(/<link>([\s\S]*?)<\/link>/i) || [])[1], 300);
      const desc = clean((item.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/i) || item.match(/<description>([\s\S]*?)<\/description>/i) || [])[1], 400);
      const time = clean((item.match(/<pubDate>([\s\S]*?)<\/pubDate>/i) || [])[1], 80);
      const point = (item.match(/<georss:point>([\s\S]*?)<\/georss:point>/i) || [])[1];

      let lat = null;
      let lng = null;

      if (point) {
        const p = point.trim().split(/\s+/).map(Number);
        if (Number.isFinite(p[0]) && Number.isFinite(p[1])) {
          lat = p[0];
          lng = p[1];
        }
      }

      items.push({
        id: url || title,
        kind: "crisis",
        title: title || "Disaster alert",
        summary: desc || title || "GDACS disaster alert",
        url,
        source: "GDACS",
        time,
        lat,
        lng
      });
    }

    return cacheSet(key, items);
  } catch {
    return cacheSet(key, []);
  }
}

async function usgsEarthquakes() {
  const key = "usgs:earthquakes";
  const cached = cacheGet(key, 5 * 60 * 1000);
  if (cached) return cached;

  try {
    const data = await getJson("https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson", {
      timeout: 25000
    });

    const features = Array.isArray(data.features) ? data.features : [];

    return cacheSet(
      key,
      features.map((f) => {
        const p = f.properties || {};
        const c = f.geometry?.coordinates || [];

        return {
          id: f.id || p.url || `${p.title}-${p.time}`,
          kind: "crisis",
          title: p.title || "Earthquake",
          place: p.place || "",
          magnitude: num(p.mag),
          time: p.time ? new Date(p.time).toISOString() : null,
          url: p.url || "",
          source: "USGS",
          lat: num(c[1]),
          lng: num(c[0]),
          depthKm: num(c[2])
        };
      })
    );
  } catch {
    return cacheSet(key, []);
  }
}

async function openMeteoPoint(lat, lng) {
  const key = `weather:${Number(lat).toFixed(2)}:${Number(lng).toFixed(2)}`;
  const cached = cacheGet(key, 10 * 60 * 1000);
  if (cached) return cached;

  try {
    const url =
      "https://api.open-meteo.com/v1/forecast" +
      `?latitude=${encodeURIComponent(lat)}` +
      `&longitude=${encodeURIComponent(lng)}` +
      "&current=temperature_2m,precipitation,rain,showers,snowfall,weather_code,wind_speed_10m,wind_gusts_10m" +
      "&hourly=precipitation_probability,precipitation,wind_gusts_10m,temperature_2m" +
      "&forecast_days=1&timezone=auto";

    const data = await getJson(url, { timeout: 20000 });
    const c = data.current || {};

    const gust = num(c.wind_gusts_10m);
    const wind = num(c.wind_speed_10m);
    const precip = num(c.precipitation);
    const rain = num(c.rain);
    const snow = num(c.snowfall);

    return cacheSet(key, {
      source: "Open-Meteo",
      coverage: "Global model weather",
      severe:
        (gust !== null && gust >= 80) ||
        (wind !== null && wind >= 60) ||
        (precip !== null && precip >= 10) ||
        (rain !== null && rain >= 10) ||
        (snow !== null && snow >= 5),
      current: {
        temperatureC: num(c.temperature_2m),
        precipitationMm: precip,
        rainMm: rain,
        snowMm: snow,
        windKmh: wind,
        gustKmh: gust,
        weatherCode: num(c.weather_code),
        time: c.time || null
      }
    });
  } catch {
    return cacheSet(key, null);
  }
}

async function policeUkPoint(lat, lng) {
  try {
    const latest = await getJson("https://data.police.uk/api/crime-last-updated", { timeout: 15000 });
    const date = latest.date;

    const url =
      "https://data.police.uk/api/crimes-street/all-crime" +
      `?date=${encodeURIComponent(date)}` +
      `&lat=${encodeURIComponent(lat)}` +
      `&lng=${encodeURIComponent(lng)}`;

    const crimes = await getJson(url, { timeout: 30000 });
    const byCategory = {};

    for (const crime of crimes) {
      const cat = crime.category || "unknown";
      byCategory[cat] = (byCategory[cat] || 0) + 1;
    }

    return {
      available: true,
      source: "data.police.uk",
      date,
      total: crimes.length,
      categories: Object.entries(byCategory)
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count),
      note: "Approximate street-level locations, not exact addresses."
    };
  } catch {
    return {
      available: false,
      source: null,
      total: null,
      categories: [],
      note: "No official local crime feed connected for this point."
    };
  }
}

function estimateSection(countryCode, rawCount, baselineScore, label) {
  const code = iso2(countryCode);
  const baseline = BASELINE[code] || {};
  const base = baseline[baselineScore];

  if (rawCount && rawCount > 0) {
    return {
      value: rawCount,
      display: String(rawCount),
      status: "Source hits",
      estimated: false,
      reason: "live source hits"
    };
  }

  if (base !== undefined) {
    return {
      value: base,
      display: base >= 70 ? "HIGH" : base >= 45 ? "ELEVATED" : "WATCH",
      status: "Estimated risk",
      estimated: true,
      reason: `${baseline.note || label} estimate`
    };
  }

  return {
    value: 0,
    display: "LOW",
    status: "Low current signal",
    estimated: true,
    reason: "no live hits from connected feeds"
  };
}

function scoreAll({ countryCode, localCrime, national, gdelt, weather, earthquakes, disasters }) {
  const nationalCrime = crimeScoreFromHomicide(national?.homicide || null);
  const money = moneyScore(national);

  const crimeScore =
    localCrime?.available && localCrime.total !== null
      ? Math.max(0, Math.min(100, Math.round(85 - Math.min(80, localCrime.total / 3))))
      : nationalCrime.score;

  const warCount = Array.isArray(gdelt?.war) ? gdelt.war.length : 0;
  const politicsCount = Array.isArray(gdelt?.politics) ? gdelt.politics.length : 0;
  const terrorCount = Array.isArray(gdelt?.terror) ? gdelt.terror.length : 0;
  const crisisCount =
    (Array.isArray(earthquakes) ? earthquakes.length : 0) +
    (Array.isArray(disasters) ? disasters.length : 0) +
    (weather?.severe ? 1 : 0);

  const war = estimateSection(countryCode, warCount, "war", "war");
  const politics = estimateSection(countryCode, politicsCount, "politics", "politics");
  const terror = estimateSection(countryCode, terrorCount, "war", "terror");
  const crisis = estimateSection(countryCode, crisisCount, "crisis", "crisis");

  let safety = crimeScore === null || crimeScore === undefined ? 65 : crimeScore;
  safety -= Math.min(32, war.value * 0.25);
  safety -= Math.min(18, terror.value * 0.25);
  safety -= Math.min(12, politics.value * 0.12);
  safety -= Math.min(20, crisis.value * 0.15);
  safety = Math.max(0, Math.min(100, Math.round(safety)));

  return {
    safety: {
      score: safety,
      status: safety >= 75 ? "Lower risk" : safety >= 55 ? "Caution" : safety >= 35 ? "High risk" : "Severe risk",
      reason: "crime + war + politics + crisis"
    },
    crime: {
      score: crimeScore === null || crimeScore === undefined ? null : Math.round(crimeScore),
      status:
        crimeScore === null || crimeScore === undefined
          ? "No source"
          : crimeScore >= 75
          ? "Lower crime signal"
          : crimeScore >= 55
          ? "Mixed"
          : crimeScore >= 35
          ? "High crime signal"
          : "Severe crime signal",
      reason: localCrime?.available ? "official local crime count" : nationalCrime.reason
    },
    war,
    politics,
    terror,
    crisis,
    money
  };
}

router.get("/boundaries/admin0", async (req, res) => {
  try {
    const cached = cacheGet("boundaries:admin0", 24 * 60 * 60 * 1000);
    if (cached) return res.json(cached);

    const url = "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_0_countries.geojson";
    const geojson = await getJson(url, { timeout: 30000 });

    const cleaned = {
      type: "FeatureCollection",
      source: "Natural Earth Admin 0 countries",
      features: (geojson.features || []).map((f) => {
        const p = f.properties || {};
        return {
          type: "Feature",
          properties: {
            name: p.NAME_LONG || p.ADMIN || p.NAME || "Unknown",
            admin: p.ADMIN || p.NAME || "Unknown",
            iso2: p.ISO_A2_EH || p.ISO_A2 || "",
            iso3: p.ISO_A3_EH || p.ISO_A3 || "",
            region: p.REGION_UN || "",
            subregion: p.SUBREGION || ""
          },
          geometry: f.geometry
        };
      })
    };

    return res.json(cacheSet("boundaries:admin0", cleaned));
  } catch (err) {
    return res.status(500).json({ error: "Could not load boundaries", detail: err.message });
  }
});

router.get("/global-risk/point", async (req, res) => {
  const lat = num(req.query.lat);
  const lng = num(req.query.lng);

  if (lat === null || lng === null) {
    return res.status(400).json({ error: "lat and lng are required" });
  }

  let place = null;
  try {
    place = await reverseLookup(lat, lng);
  } catch {
    place = null;
  }

  const countryCode = iso2(place?.countryCode);
  const countryName = place?.country || "";
  const city = place?.city || "";
  const isUk = countryCode === "GB" || /united kingdom|england|wales|northern ireland/i.test(countryName);

  const [national, gdelt, disastersAll, quakesAll, weather, localCrime] = await Promise.all([
    worldBankBundle(countryCode),
    gdeltBundle(countryName, city),
    gdacsDisasters(),
    usgsEarthquakes(),
    openMeteoPoint(lat, lng),
    isUk ? policeUkPoint(lat, lng) : Promise.resolve({
      available: false,
      source: null,
      total: null,
      categories: [],
      note: "No official local crime feed connected here."
    })
  ]);

  const nearQuakes = (quakesAll || []).filter((q) => q.lat !== null && q.lng !== null && Math.abs(q.lat - lat) <= 8 && Math.abs(q.lng - lng) <= 8);
  const nearDisasters = (disastersAll || []).filter((d) => d.lat !== null && d.lng !== null && Math.abs(d.lat - lat) <= 10 && Math.abs(d.lng - lng) <= 10);

  const scores = scoreAll({
    countryCode,
    localCrime,
    national,
    gdelt,
    weather,
    earthquakes: nearQuakes,
    disasters: nearDisasters
  });

  return res.json({
    ok: true,
    place,
    countryCode,
    countryName,
    lat,
    lng,
    scores,
    localCrime,
    national,
    warEvents: gdelt.war,
    politicalEvents: gdelt.politics,
    terrorEvents: gdelt.terror,
    localNews: gdelt.localNews,
    weather,
    earthquakes: nearQuakes.slice(0, 20),
    disasters: nearDisasters.slice(0, 20),
    sourceStatus: {
      localCrime: localCrime.available ? "official local feed" : "N/A, no official local feed connected here",
      nationalCrime: national?.homicide ? "World Bank homicide indicator" : "N/A",
      warPolitics: "GDELT + baseline estimate when no live hit",
      crisis: "GDACS + USGS + Open-Meteo + baseline estimate"
    }
  });
});

router.get("/crime/point", async (req, res) => {
  const lat = req.query.lat;
  const lng = req.query.lng;
  req.url = `/global-risk/point?lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(lng)}`;
  return router.handle(req, res);
});

router.get("/global-events/local", async (req, res) => {
  const lat = num(req.query.lat);
  const lng = num(req.query.lng);

  if (lat === null || lng === null) {
    return res.status(400).json({ error: "lat and lng are required" });
  }

  let place = null;
  try {
    place = await reverseLookup(lat, lng);
  } catch {
    place = null;
  }

  const bundle = await gdeltBundle(place?.country || "", place?.city || place?.state || "");
  return res.json({ ok: true, source: "GDELT", place, articles: bundle.localNews });
});

router.get("/geocode/place", async (req, res) => {
  const q = String(req.query.q || "").trim();

  if (!q) {
    return res.status(400).json({ error: "q is required" });
  }

  const key = `geocode:${q.toLowerCase()}`;
  const cached = cacheGet(key, 7 * 24 * 60 * 60 * 1000);
  if (cached) return res.json(cached);

  try {
    const url =
      "https://nominatim.openstreetmap.org/search" +
      `?format=jsonv2&q=${encodeURIComponent(q)}` +
      "&limit=1&addressdetails=1&accept-language=en";

    const rows = await getJson(url, { timeout: 15000 });
    const hit = Array.isArray(rows) ? rows[0] : null;

    const result = hit
      ? {
          ok: true,
          lat: num(hit.lat),
          lng: num(hit.lon),
          displayName: hit.display_name || q
        }
      : {
          ok: false,
          lat: null,
          lng: null,
          displayName: q
        };

    return res.json(cacheSet(key, result));
  } catch (err) {
    return res.status(500).json({ error: "geocode failed", detail: err.message });
  }
});

router.get("/global-weather/earthquakes", async (req, res) => {
  return res.json({ ok: true, source: "USGS", earthquakes: await usgsEarthquakes() });
});

router.get("/global-weather/disasters", async (req, res) => {
  return res.json({ ok: true, source: "GDACS", disasters: await gdacsDisasters() });
});

router.get("/global-weather/point", async (req, res) => {
  const lat = num(req.query.lat);
  const lng = num(req.query.lng);

  if (lat === null || lng === null) {
    return res.status(400).json({ error: "lat and lng are required" });
  }

  return res.json({ ok: true, weather: await openMeteoPoint(lat, lng) });
});

router.get("/wiki/place", async (req, res) => {
  try {
    const name = String(req.query.name || "").trim();
    const country = String(req.query.country || "").trim();

    if (!name) {
      return res.status(400).json({ error: "name is required" });
    }

    const key = `wiki:${name}:${country}`.toLowerCase();
    const cached = cacheGet(key, 7 * 24 * 60 * 60 * 1000);
    if (cached) return res.json(cached);

    const searchTerm = country ? `${name} ${country}` : name;
    const searchUrl =
      "https://en.wikipedia.org/w/api.php" +
      "?action=query&list=search&format=json&utf8=1" +
      `&srsearch=${encodeURIComponent(searchTerm)}` +
      "&srlimit=1";

    const search = await getJson(searchUrl);
    const hit = search?.query?.search?.[0];

    if (!hit?.title) {
      return res.json(cacheSet(key, {
        found: false,
        title: name,
        thumbnail: null,
        extract: null,
        url: null,
        source: "Wikipedia search"
      }));
    }

    const summary = await getJson(
      "https://en.wikipedia.org/api/rest_v1/page/summary/" + encodeURIComponent(hit.title)
    );

    return res.json(cacheSet(key, {
      found: true,
      title: summary.title || hit.title,
      description: summary.description || "",
      extract: summary.extract || "",
      thumbnail: summary.thumbnail?.source || null,
      originalImage: summary.originalimage?.source || null,
      url: summary.content_urls?.desktop?.page || null,
      source: "Wikipedia / Wikimedia summary"
    }));
  } catch (err) {
    return res.status(500).json({ error: "Could not load wiki image", detail: err.message });
  }
});

module.exports = router;
