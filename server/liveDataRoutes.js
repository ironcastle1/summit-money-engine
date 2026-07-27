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

function cacheGet(key, maxAgeMs) {
  const item = CACHE.get(key);
  if (!item) return null;
  if (Date.now() - item.time > maxAgeMs) {
    CACHE.delete(key);
    return null;
  }
  return item.value;
}

function cacheSet(key, value) {
  CACHE.set(key, { time: Date.now(), value });
  return value;
}

function n(value) {
  const x = Number(value);
  return Number.isFinite(x) ? x : null;
}

function iso2(value) {
  const x = String(value || "").trim().toUpperCase();
  if (!x || x.length !== 2) return null;
  return x === "UK" ? "GB" : x;
}

function cleanText(value, max = 500) {
  return String(value || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

async function getJson(url, options = {}) {
  const response = await axios.get(url, {
    timeout: options.timeout || 20000,
    headers: {
      "User-Agent": "SummitMoneyEngine/1.0",
      Accept: "application/json",
      ...(options.headers || {})
    }
  });
  return response.data;
}

async function getText(url, options = {}) {
  const response = await axios.get(url, {
    timeout: options.timeout || 20000,
    headers: {
      "User-Agent": "SummitMoneyEngine/1.0",
      Accept: options.accept || "text/plain, text/xml, application/xml, */*",
      ...(options.headers || {})
    }
  });
  return String(response.data || "");
}

async function reverseLookup(lat, lng) {
  const key = `reverse:${Number(lat).toFixed(3)}:${Number(lng).toFixed(3)}`;
  const cached = cacheGet(key, 24 * 60 * 60 * 1000);
  if (cached) return cached;

  const url =
    "https://nominatim.openstreetmap.org/reverse" +
    `?format=jsonv2&lat=${encodeURIComponent(lat)}` +
    `&lon=${encodeURIComponent(lng)}` +
    "&zoom=10&addressdetails=1";

  const data = await getJson(url, { timeout: 15000 });
  const a = data.address || {};

  const result = {
    displayName: data.display_name || "",
    city: a.city || a.town || a.village || a.hamlet || a.county || "",
    state: a.state || a.region || "",
    country: a.country || "",
    countryCode: iso2(a.country_code),
    raw: a
  };

  return cacheSet(key, result);
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
    const hit = rows.find((row) => row.value !== null && row.value !== undefined);

    const result = hit
      ? {
          value: n(hit.value),
          year: hit.date || null,
          indicator,
          source: "World Bank"
        }
      : null;

    return cacheSet(key, result);
  } catch (err) {
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

function safetyFromHomicide(homicide) {
  if (!homicide || homicide.value === null || homicide.value === undefined) {
    return {
      score: null,
      status: "N/A",
      reason: "No World Bank homicide indicator"
    };
  }

  const value = Number(homicide.value);

  let score = 85;
  if (value >= 25) score = 15;
  else if (value >= 15) score = 28;
  else if (value >= 8) score = 42;
  else if (value >= 4) score = 58;
  else if (value >= 2) score = 72;
  else score = 88;

  return {
    score,
    status:
      score >= 75
        ? "Lower risk"
        : score >= 55
        ? "Caution"
        : score >= 35
        ? "High risk"
        : "Severe risk",
    reason: `${value.toFixed(1)} homicides per 100k, ${homicide.year || "year N/A"}`
  };
}

function moneyFromMacro(bundle) {
  if (!bundle) {
    return {
      score: null,
      status: "N/A",
      reason: "No World Bank macro data"
    };
  }

  let score = 50;
  const reasons = [];

  if (bundle.gdpGrowth?.value !== null && bundle.gdpGrowth?.value !== undefined) {
    const v = Number(bundle.gdpGrowth.value);
    if (v >= 5) {
      score += 18;
      reasons.push("strong GDP growth");
    } else if (v >= 2) {
      score += 8;
      reasons.push("positive GDP growth");
    } else if (v < 0) {
      score -= 18;
      reasons.push("GDP shrinking");
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
      reasons.push("inflation controlled");
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
    const v = Number(bundle.tradeGdp.value);
    if (v > 70) {
      score += 8;
      reasons.push("trade-heavy economy");
    }
  }

  if (bundle.internet?.value !== null && bundle.internet?.value !== undefined) {
    const v = Number(bundle.internet.value);
    if (v > 80) {
      score += 6;
      reasons.push("high internet use");
    }
  }

  score = Math.max(0, Math.min(100, Math.round(score)));

  return {
    score,
    status: score >= 70 ? "Stronger" : score >= 45 ? "Mixed" : "Weaker",
    reason: reasons.length ? reasons.join(", ") : "limited macro signal"
  };
}

async function gdeltArticles(query, maxRecords = 30) {
  const key = `gdelt:${query}:${maxRecords}`;
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

    const result = articles.map((a) => ({
      title: cleanText(a.title, 180),
      url: a.url || "",
      source: a.domain || a.source || "GDELT",
      sourceCountry: a.sourceCountry || "",
      language: a.language || "",
      seenDate: a.seendate || "",
      summary: cleanText(a.title, 220)
    }));

    return cacheSet(key, result);
  } catch (err) {
    return cacheSet(key, []);
  }
}

async function gdeltCountryBundle(countryName) {
  if (!countryName) {
    return {
      war: [],
      politics: [],
      terror: []
    };
  }

  const safeCountry = `"${countryName}"`;

  const [war, politics, terror] = await Promise.all([
    gdeltArticles(`${safeCountry} (war OR missile OR drone OR shelling OR battle OR invasion OR clashes OR military)`, 25),
    gdeltArticles(`${safeCountry} (election OR protest OR coup OR sanctions OR parliament OR unrest OR government)`, 25),
    gdeltArticles(`${safeCountry} (terror OR terrorist OR bombing OR attack OR extremist OR insurgent)`, 25)
  ]);

  return { war, politics, terror };
}

async function gdeltLocalBundle(placeName, countryName) {
  const queryPlace = [placeName, countryName].filter(Boolean).join(" ");
  if (!queryPlace) return [];

  return gdeltArticles(`"${queryPlace}"`, 20);
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
    const itemRegex = /<item[\s\S]*?<\/item>/gi;
    const matches = xml.match(itemRegex) || [];

    for (const item of matches.slice(0, 80)) {
      const title = cleanText((item.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/i) || item.match(/<title>([\s\S]*?)<\/title>/i) || [])[1], 180);
      const link = cleanText((item.match(/<link>([\s\S]*?)<\/link>/i) || [])[1], 300);
      const desc = cleanText((item.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/i) || item.match(/<description>([\s\S]*?)<\/description>/i) || [])[1], 400);
      const pubDate = cleanText((item.match(/<pubDate>([\s\S]*?)<\/pubDate>/i) || [])[1], 80);
      const point = (item.match(/<georss:point>([\s\S]*?)<\/georss:point>/i) || [])[1];

      let lat = null;
      let lng = null;

      if (point) {
        const parts = point.trim().split(/\s+/).map(Number);
        if (Number.isFinite(parts[0]) && Number.isFinite(parts[1])) {
          lat = parts[0];
          lng = parts[1];
        }
      }

      items.push({
        id: link || title,
        kind: "disaster",
        title,
        summary: desc || title,
        url: link,
        source: "GDACS",
        time: pubDate,
        place: title,
        lat,
        lng
      });
    }

    return cacheSet(key, items);
  } catch (err) {
    return cacheSet(key, []);
  }
}

async function usgsEarthquakes() {
  const key = "usgs:earthquakes:day";
  const cached = cacheGet(key, 5 * 60 * 1000);
  if (cached) return cached;

  try {
    const data = await getJson(
      "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson",
      { timeout: 25000 }
    );

    const features = Array.isArray(data.features) ? data.features : [];

    const result = features.map((f) => {
      const p = f.properties || {};
      const c = f.geometry?.coordinates || [];

      return {
        id: f.id || p.code || p.url || `${p.title}-${p.time}`,
        kind: "earthquake",
        title: p.title || "Earthquake",
        summary: p.title || "USGS earthquake",
        place: p.place || "",
        magnitude: n(p.mag),
        time: p.time ? new Date(p.time).toISOString() : null,
        url: p.url || "",
        source: "USGS",
        lat: n(c[1]),
        lng: n(c[0]),
        depthKm: n(c[2])
      };
    });

    return cacheSet(key, result);
  } catch (err) {
    return cacheSet(key, []);
  }
}

async function openMeteoPoint(lat, lng) {
  const key = `openmeteo:${Number(lat).toFixed(2)}:${Number(lng).toFixed(2)}`;
  const cached = cacheGet(key, 10 * 60 * 1000);
  if (cached) return cached;

  try {
    const url =
      "https://api.open-meteo.com/v1/forecast" +
      `?latitude=${encodeURIComponent(lat)}` +
      `&longitude=${encodeURIComponent(lng)}` +
      "&current=temperature_2m,precipitation,rain,showers,snowfall,weather_code,wind_speed_10m,wind_gusts_10m" +
      "&hourly=precipitation_probability,precipitation,wind_gusts_10m,temperature_2m" +
      "&forecast_days=1" +
      "&timezone=auto";

    const data = await getJson(url, { timeout: 20000 });

    const current = data.current || {};
    const gust = n(current.wind_gusts_10m);
    const wind = n(current.wind_speed_10m);
    const precip = n(current.precipitation);
    const rain = n(current.rain);
    const snow = n(current.snowfall);

    const severe =
      (gust !== null && gust >= 80) ||
      (wind !== null && wind >= 60) ||
      (precip !== null && precip >= 10) ||
      (rain !== null && rain >= 10) ||
      (snow !== null && snow >= 5);

    const result = {
      source: "Open-Meteo",
      coverage: "Global forecast model data",
      lat,
      lng,
      severe,
      current: {
        temperatureC: n(current.temperature_2m),
        precipitationMm: precip,
        rainMm: rain,
        snowMm: snow,
        windKmh: wind,
        gustKmh: gust,
        weatherCode: n(current.weather_code),
        time: current.time || null
      }
    };

    return cacheSet(key, result);
  } catch (err) {
    return cacheSet(key, null);
  }
}

async function policeUkPoint(lat, lng) {
  try {
    const latest = await getJson("https://data.police.uk/api/crime-last-updated", {
      timeout: 15000
    });

    const date = latest.date;

    const url =
      "https://data.police.uk/api/crimes-street/all-crime" +
      `?date=${encodeURIComponent(date)}` +
      `&lat=${encodeURIComponent(lat)}` +
      `&lng=${encodeURIComponent(lng)}`;

    const crimes = await getJson(url, { timeout: 30000 });

    const byCategory = {};
    for (const crime of crimes) {
      const c = crime.category || "unknown";
      byCategory[c] = (byCategory[c] || 0) + 1;
    }

    const categories = Object.entries(byCategory)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);

    return {
      available: true,
      source: "data.police.uk",
      date,
      total: crimes.length,
      categories,
      note: "Police.uk gives approximate street-level locations, not exact addresses."
    };
  } catch (err) {
    return {
      available: false,
      source: null,
      total: null,
      categories: [],
      note: "No Police.uk local crime result for this point."
    };
  }
}

function countEvents(list) {
  return Array.isArray(list) ? list.length : 0;
}

function globalRiskScores({ localCrime, national, gdelt, weather, earthquakes, disasters }) {
  const crimeNational = safetyFromHomicide(national?.homicide || null);
  const money = moneyFromMacro(national);

  const crimeScore =
    localCrime?.available && localCrime.total !== null
      ? Math.max(0, Math.min(100, 85 - Math.min(80, localCrime.total / 3)))
      : crimeNational.score;

  const warCount = countEvents(gdelt?.war);
  const terrorCount = countEvents(gdelt?.terror);
  const politicsCount = countEvents(gdelt?.politics);
  const quakeCount = countEvents(earthquakes);
  const disasterCount = countEvents(disasters);

  let safety = crimeScore === null || crimeScore === undefined ? 60 : crimeScore;
  safety -= Math.min(35, warCount * 3);
  safety -= Math.min(25, terrorCount * 4);
  safety -= Math.min(20, disasterCount * 3);
  safety -= Math.min(10, quakeCount * 1);
  if (weather?.severe) safety -= 10;
  safety = Math.max(0, Math.min(100, Math.round(safety)));

  return {
    safety: {
      score: safety,
      status:
        safety >= 75
          ? "Lower risk"
          : safety >= 55
          ? "Caution"
          : safety >= 35
          ? "High risk"
          : "Severe risk",
      reason: "crime indicator + war/political/disaster/weather events"
    },
    crime: {
      score: crimeScore === null || crimeScore === undefined ? null : Math.round(crimeScore),
      status:
        crimeScore === null || crimeScore === undefined
          ? "N/A"
          : crimeScore >= 75
          ? "Lower crime signal"
          : crimeScore >= 55
          ? "Mixed"
          : crimeScore >= 35
          ? "High crime signal"
          : "Severe crime signal",
      source: localCrime?.available ? "data.police.uk local count" : crimeNational.reason
    },
    war: {
      count: warCount,
      status: warCount ? "Active source hits" : "No current source hits"
    },
    politics: {
      count: politicsCount,
      status: politicsCount ? "Active political source hits" : "No current source hits"
    },
    terror: {
      count: terrorCount,
      status: terrorCount ? "Active terror source hits" : "No current source hits"
    },
    weather: {
      count: quakeCount + disasterCount + (weather?.severe ? 1 : 0),
      status:
        weather?.severe || quakeCount || disasterCount
          ? "Weather/disaster source hits"
          : "No current mapped weather/disaster hit"
    },
    money
  };
}

router.get("/global-risk/point", async (req, res) => {
  const lat = n(req.query.lat);
  const lng = n(req.query.lng);

  if (lat === null || lng === null) {
    return res.status(400).json({ error: "lat and lng are required" });
  }

  let place = null;
  try {
    place = await reverseLookup(lat, lng);
  } catch (err) {
    place = null;
  }

  const countryCode = iso2(place?.countryCode);
  const countryName = place?.country || "";
  const city = place?.city || "";

  const isUk =
    countryCode === "GB" ||
    /united kingdom|england|wales|northern ireland/i.test(countryName);

  const [
    national,
    gdelt,
    localNews,
    disastersAll,
    quakesAll,
    weather,
    localCrime
  ] = await Promise.all([
    worldBankBundle(countryCode),
    gdeltCountryBundle(countryName),
    gdeltLocalBundle(city, countryName),
    gdacsDisasters(),
    usgsEarthquakes(),
    openMeteoPoint(lat, lng),
    isUk ? policeUkPoint(lat, lng) : Promise.resolve({
      available: false,
      source: null,
      total: null,
      categories: [],
      note: "No official local crime feed connected for this country."
    })
  ]);

  const nearQuakes = (quakesAll || []).filter((q) => {
    if (q.lat === null || q.lng === null) return false;
    return Math.abs(q.lat - lat) <= 8 && Math.abs(q.lng - lng) <= 8;
  });

  const nearDisasters = (disastersAll || []).filter((d) => {
    if (d.lat === null || d.lng === null) return false;
    return Math.abs(d.lat - lat) <= 10 && Math.abs(d.lng - lng) <= 10;
  });

  const scores = globalRiskScores({
    localCrime,
    national,
    gdelt,
    weather,
    earthquakes: nearQuakes,
    disasters: nearDisasters
  });

  return res.json({
    ok: true,
    sourceMode: "global-risk-stack",
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
    localNews,
    weather,
    earthquakes: nearQuakes.slice(0, 20),
    disasters: nearDisasters.slice(0, 20),
    sourceStatus: {
      localCrime:
        localCrime.available
          ? "official local feed"
          : "N/A, no official local feed connected here",
      nationalCrime:
        national?.homicide
          ? "World Bank homicide indicator"
          : "N/A",
      warPolitics:
        "GDELT article/event monitor",
      disasters:
        "GDACS + USGS + Open-Meteo"
    }
  });
});

router.get("/crime/point", async (req, res) => {
  req.url = `/global-risk/point?lat=${encodeURIComponent(req.query.lat)}&lng=${encodeURIComponent(req.query.lng)}`;
  return router.handle(req, res);
});

router.get("/global-events/local", async (req, res) => {
  const lat = n(req.query.lat);
  const lng = n(req.query.lng);

  if (lat === null || lng === null) {
    return res.status(400).json({ error: "lat and lng are required" });
  }

  let place = null;
  try {
    place = await reverseLookup(lat, lng);
  } catch (err) {
    place = null;
  }

  const articles = await gdeltLocalBundle(place?.city || place?.state || place?.country || "", place?.country || "");

  return res.json({
    ok: true,
    source: "GDELT",
    place,
    articles
  });
});

router.get("/global-events/conflict", async (req, res) => {
  const q = String(req.query.country || "global conflict").trim();
  const events = await gdeltArticles(`"${q}" (war OR missile OR drone OR shelling OR battle OR invasion OR clashes)`, 50);
  return res.json({ ok: true, source: "GDELT", events });
});

router.get("/global-events/political", async (req, res) => {
  const q = String(req.query.country || "global politics").trim();
  const events = await gdeltArticles(`"${q}" (election OR protest OR coup OR sanctions OR parliament OR unrest OR government)`, 50);
  return res.json({ ok: true, source: "GDELT", events });
});

router.get("/global-weather/earthquakes", async (req, res) => {
  const earthquakes = await usgsEarthquakes();
  return res.json({
    ok: true,
    source: "USGS",
    earthquakes
  });
});

router.get("/global-weather/disasters", async (req, res) => {
  const disasters = await gdacsDisasters();
  return res.json({
    ok: true,
    source: "GDACS",
    disasters
  });
});

router.get("/global-weather/point", async (req, res) => {
  const lat = n(req.query.lat);
  const lng = n(req.query.lng);

  if (lat === null || lng === null) {
    return res.status(400).json({ error: "lat and lng are required" });
  }

  const weather = await openMeteoPoint(lat, lng);
  return res.json({
    ok: !!weather,
    weather
  });
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
      "?action=query" +
      "&list=search" +
      "&format=json" +
      "&utf8=1" +
      `&srsearch=${encodeURIComponent(searchTerm)}` +
      "&srlimit=1";

    const search = await getJson(searchUrl);
    const hit = search?.query?.search?.[0];

    if (!hit?.title) {
      return res.json(
        cacheSet(key, {
          found: false,
          title: name,
          thumbnail: null,
          originalImage: null,
          extract: null,
          url: null,
          source: "Wikipedia search"
        })
      );
    }

    const summaryUrl =
      "https://en.wikipedia.org/api/rest_v1/page/summary/" +
      encodeURIComponent(hit.title);

    const summary = await getJson(summaryUrl);

    const result = {
      found: true,
      title: summary.title || hit.title,
      description: summary.description || "",
      extract: summary.extract || "",
      thumbnail: summary.thumbnail?.source || null,
      originalImage: summary.originalimage?.source || null,
      url: summary.content_urls?.desktop?.page || null,
      source: "Wikipedia / Wikimedia page summary"
    };

    return res.json(cacheSet(key, result));
  } catch (err) {
    return res.status(500).json({
      error: "Could not load Wikipedia place image",
      detail: err.message
    });
  }
});

module.exports = router;
