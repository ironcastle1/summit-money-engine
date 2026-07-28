const { refreshState } = require("../core/stateStore");
const { haversineKm } = require("../core/geo");
const { searchPlaces, reverseGeocode, nearbyInfrastructure, wikiPlace } = require("../collectors/placeCollectors");
const { ukCrimeAt, ukCrimeRadius } = require("../collectors/policeUkCollector");
const { weatherAt } = require("../collectors/weatherCollector");
const { getCountryIndicators } = require("../collectors/worldBankCollector");
const { fcdoAdvice } = require("../collectors/advisoryCollector");
const { byIso, byName } = require("../data/countryMeta");

const REQUIRED_INFRA = [
  "hospital",
  "clinic",
  "pharmacy",
  "police_station",
  "embassy_consulate",
  "airport_airfield",
  "fuel_station",
  "border_crossing",
  "port_harbour",
  "rail_station",
  "main_road"
];

function clean(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function withTimeout(promise, ms, fallback) {
  return Promise.race([
    promise,
    new Promise(resolve => setTimeout(() => resolve(fallback), ms))
  ]);
}

function milesToKm(miles) {
  const n = Number(miles);
  if (!Number.isFinite(n)) return 8.04672;
  return Math.max(0.5, Math.min(50, n)) * 1.609344;
}

function verdictFromSignals({ country, localCrime, insideEvents, nearEvents, infrastructure, advisory, weather }) {
  const reasons = [];
  const actions = [];
  let danger = 0;
  let confidence = 0;

  const insideWar = insideEvents.filter(e => e.kind === "war").length;
  const insideTerror = insideEvents.filter(e => e.kind === "terror").length;
  const insideCrisis = insideEvents.filter(e => e.kind === "crisis").length;
  const insidePolitics = insideEvents.filter(e => e.kind === "politics").length;
  const nearWar = nearEvents.filter(e => e.kind === "war").length;
  const nearTerror = nearEvents.filter(e => e.kind === "terror").length;

  if (insideWar) {
    danger += insideWar * 32;
    reasons.push(`${insideWar} conflict/security event${insideWar === 1 ? "" : "s"} inside the scan circle`);
  }
  if (insideTerror) {
    danger += insideTerror * 35;
    reasons.push(`${insideTerror} terror/attack event${insideTerror === 1 ? "" : "s"} inside the scan circle`);
  }
  if (insideCrisis) {
    danger += insideCrisis * 14;
    reasons.push(`${insideCrisis} crisis/weather/disaster signal${insideCrisis === 1 ? "" : "s"} inside the scan circle`);
  }
  if (insidePolitics) {
    danger += insidePolitics * 8;
    reasons.push(`${insidePolitics} protest/political disruption signal${insidePolitics === 1 ? "" : "s"} inside the scan circle`);
  }
  if (nearWar || nearTerror) {
    danger += nearWar * 10 + nearTerror * 12;
    reasons.push(`${nearWar + nearTerror} serious security signal${nearWar + nearTerror === 1 ? "" : "s"} close to the area`);
  }

  if (advisory && advisory.level) {
    confidence += 1;
    const level = String(advisory.level).toLowerCase();
    if (level.includes("avoid all")) {
      danger += 45;
      reasons.push("official travel advice includes avoid all travel");
    } else if (level.includes("essential")) {
      danger += 28;
      reasons.push("official travel advice includes essential travel only");
    } else {
      reasons.push(`official travel advice loaded: ${advisory.level}`);
    }
  }

  if (localCrime && localCrime.available) {
    confidence += 1;
    const total = Number(localCrime.total || 0);
    if (total >= 80) {
      danger += 20;
      reasons.push(`${total} official local crime records in the latest police month`);
    } else if (total >= 35) {
      danger += 10;
      reasons.push(`${total} official local crime records in the latest police month`);
    } else {
      reasons.push(`${total} official local crime records in the latest police month`);
    }
  } else {
    reasons.push("no official local crime feed for this country/area");
  }

  if (weather && weather.current) {
    confidence += 1;
    const gust = Number(weather.current.gustKmh || 0);
    const rain = Number(weather.current.precipitationMm || weather.current.rainMm || 0);
    if (gust >= 70 || rain >= 20) {
      danger += 12;
      reasons.push("current weather may disrupt movement");
    }
  }

  const counts = infrastructure && infrastructure.counts || {};
  const hospitalLike = (counts.hospital || 0) + (counts.clinic || 0);
  const police = counts.police_station || 0;
  const pharmacy = counts.pharmacy || 0;
  const fuel = counts.fuel_station || 0;
  const road = counts.main_road || 0;
  const communications = counts.communications || 0;
  const water = counts.water_point || 0;
  const food = counts.food_supply || 0;

  if (hospitalLike) {
    confidence += 1;
    reasons.push(`${hospitalLike} hospital/clinic item${hospitalLike === 1 ? "" : "s"} found in radius`);
  } else {
    reasons.push("no named hospital or clinic returned from OSM inside the scan radius; treat medical access as unconfirmed, not absent");
  }
  if (!police) reasons.push("no police station found in the scan radius from OSM");
  if (!pharmacy) reasons.push("no pharmacy found in the scan radius from OSM");
  if (!fuel) reasons.push("no fuel station found in the scan radius from OSM");
  if (!road) reasons.push("no main road segment found in the scan radius from OSM");
  if (communications) reasons.push(`${communications} communications mast/tower item${communications === 1 ? "" : "s"} found in radius`);
  if (water) reasons.push(`${water} drinking-water point${water === 1 ? "" : "s"} found in radius`);
  if (food) reasons.push(`${food} food supply/shop item${food === 1 ? "" : "s"} found in radius`);

  if (insideWar || insideTerror) actions.push("Do not move until the source and exact location are checked.");
  if (advisory && String(advisory.level || "").toLowerCase().includes("avoid")) actions.push("Treat official travel advice as the controlling warning.");
  actions.push("Check the nearest hospital, police station, main road and fuel point before moving.");
  actions.push("Use this as a public-source scan, not a guarantee of safety.");

  let verdict = "UNKNOWN";
  if (danger >= 82) verdict = "AVOID";
  else if (danger >= 45) verdict = "CAUTION";
  else if (confidence >= 1) verdict = "SAFE";

  if (!country) verdict = "UNKNOWN";

  return {
    verdict,
    danger: Math.max(0, Math.min(100, Math.round(danger))),
    confidence: confidence >= 3 ? "good public-source coverage" : confidence >= 1 ? "limited public-source coverage" : "weak coverage",
    reasons: reasons.slice(0, 12),
    actions
  };
}

function groupInfrastructure(infrastructure) {
  const items = infrastructure.items || [];
  const groups = {};
  for (const type of REQUIRED_INFRA) groups[type] = [];

  for (const item of items) {
    if (!groups[item.type]) groups[item.type] = [];
    groups[item.type].push(item);
  }

  for (const type of Object.keys(groups)) {
    groups[type] = groups[type]
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, type === "main_road" ? 8 : 6);
  }

  const nearest = REQUIRED_INFRA.map(type => ({
    type,
    item: groups[type] && groups[type][0] || null,
    count: groups[type] ? groups[type].length : 0
  }));

  return { groups, nearest, requiredTypes: REQUIRED_INFRA };
}

function sortEventsByDistance(events, lat, lng, limit = 80) {
  return (events || [])
    .map(e => ({ ...e, distanceKm: haversineKm(lat, lng, e.lat, e.lng) }))
    .filter(e => Number.isFinite(e.distanceKm))
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, limit);
}


function scoreAccess(counts, types, strongAt, estimatedFloor = 22) {
  const total = types.reduce((sum, t) => sum + Number(counts[t] || 0), 0);
  const raw = Math.max(0, Math.min(100, Math.round((total / strongAt) * 100)));
  return total > 0 ? raw : estimatedFloor;
}
function estimateAreaMetrics({ localCrime, indicators, infrastructure, insideEvents, nearEvents, weather, advisory }) {
  const counts = infrastructure && infrastructure.counts || {};
  const war = insideEvents.filter(e => e.kind === "war").length;
  const terror = insideEvents.filter(e => e.kind === "terror").length;
  const crisis = insideEvents.filter(e => e.kind === "crisis").length;
  const movement = insideEvents.filter(e => e.kind === "movement").length;
  const nearSerious = nearEvents.filter(e => e.kind === "war" || e.kind === "terror").length;
  const hospitalAccess = scoreAccess(counts, ["hospital", "clinic"], 3, 38);
  const pharmacyAccess = scoreAccess(counts, ["pharmacy"], 5, 35);
  const policeAccess = scoreAccess(counts, ["police_station"], 2, 28);
  const fuelAccess = scoreAccess(counts, ["fuel_station"], 4, 30);
  const transportAccess = scoreAccess(counts, ["main_road", "rail_station", "airport_airfield", "port_harbour", "border_crossing"], 8, 45);
  const commsAccess = scoreAccess(counts, ["communications", "power_infrastructure"], 4, 35);
  const survivalAccess = scoreAccess(counts, ["water_point", "shelter", "food_supply", "fuel_station"], 8, 42);
  const medicalAccess = Math.round(hospitalAccess * 0.7 + pharmacyAccess * 0.3);
  const infraAccess = Math.round(medicalAccess * 0.25 + policeAccess * 0.20 + fuelAccess * 0.12 + transportAccess * 0.23 + commsAccess * 0.10 + survivalAccess * 0.10);
  let crimeRisk = null;
  if (localCrime && localCrime.available && Number.isFinite(Number(localCrime.total))) {
    const total = Number(localCrime.total);
    crimeRisk = Math.max(0, Math.min(45, Math.round(Math.sqrt(total) * 2.4))); // conservative: official local count is a signal, not a personal-danger verdict
  } else if (indicators && indicators.homicide && Number.isFinite(Number(indicators.homicide.value))) {
    crimeRisk = Math.max(0, Math.min(70, Math.round(Number(indicators.homicide.value) * 5.5)));
  }
  const eventRisk = Math.max(0, Math.min(100, Math.round(war * 35 + terror * 38 + crisis * 14 + movement * 10 + nearSerious * 8)));
  const gust = weather && weather.current ? Number(weather.current.gustKmh || 0) : 0;
  const rain = weather && weather.current ? Number(weather.current.precipitationMm || weather.current.rainMm || 0) : 0;
  const weatherRisk = Math.max(0, Math.min(100, Math.round((gust >= 70 ? 30 : 0) + (rain >= 20 ? 25 : 0))));
  const advisoryRisk = advisory && advisory.level ? (/avoid all/i.test(advisory.level) ? 90 : /essential/i.test(advisory.level) ? 65 : /against/i.test(advisory.level) ? 75 : 25) : null;
  const securityRisk = Math.max(eventRisk, crimeRisk ?? 0, advisoryRisk ?? 0, weatherRisk);
  const rawSafety = 100 - securityRisk * 0.50 + infraAccess * 0.10;
  const safetyEstimate = Math.max(10, Math.min(90, Math.round(rawSafety / 5) * 5));
  const unsafeEstimate = 100 - safetyEstimate;
  const confidenceParts = [
    localCrime && localCrime.available ? "local crime" : null,
    Object.keys(counts).length ? "OSM infrastructure" : null,
    insideEvents.length || nearEvents.length ? "live event feeds" : null,
    indicators && indicators.homicide && indicators.homicide.value !== null ? "World Bank" : null,
    weather && weather.current ? "weather" : null,
    advisory && advisory.available ? "travel advisory" : null
  ].filter(Boolean);
  return {
    safetyEstimate,
    unsafeEstimate,
    securityRisk,
    eventRisk,
    crimeRisk,
    medicalAccess,
    policeAccess,
    transportAccess,
    fuelAccess,
    infrastructureAccess: infraAccess,
    weatherRisk,
    advisoryRisk,
    dataBasis: confidenceParts,
    labels: {
      safetyEstimate: "ESTIMATE from local crime if available, national indicators, live events, weather, advisory and infrastructure",
      securityRisk: "ESTIMATE from events, crime/advisory/weather risk",
      medicalAccess: "OSM infrastructure count inside radius",
      policeAccess: "OSM police station count inside radius",
      transportAccess: "OSM road/rail/airport/port/border features inside radius"
    }
  };
}
function wantedKind(filter, e) {
  const f = String(filter || "all").toLowerCase();
  if (f === "all") return true;
  if (f === "security") return ["war", "terror", "politics"].includes(e.kind);
  if (f === "crisis") return e.kind === "crisis";
  if (f === "movement") return e.kind === "movement";
  if (f === "money") return e.kind === "money";
  return true;
}

async function runAreaScan({ query, radiusMiles, filter }) {
  const q = clean(query);
  if (!q) throw new Error("Search area required");

  const radiusMi = Math.max(0.5, Math.min(50, Number(radiusMiles) || 5));
  const radiusKm = milesToKm(radiusMi);

  const places = await withTimeout(searchPlaces(q), 3500, []);
  const target = places[0];
  if (!target) return { ok: false, error: "No place found", query: q, radiusMiles: radiusMi, radiusKm };

  const lat = Number(target.lat);
  const lng = Number(target.lng);
  const state = await refreshState(false);
  const place = await withTimeout(reverseGeocode(lat, lng), 2500, { displayName: target.displayName || target.name || q, name: target.name || q, country: target.country || "", countryCode: target.countryCode || null, city: target.name || q, raw: {}, source: "search fallback" });
  const country = byIso(place.countryCode) || byName(place.country);

  if (!country && !place.countryCode && !place.country) {
    return {
      ok: true,
      isUnresolved: true,
      query: q,
      radiusMiles: radiusMi,
      radiusKm,
      target: { ...target, lat, lng },
      place,
      verdict: { verdict: "UNKNOWN", danger: null, confidence: "ocean/no land country resolved", reasons: ["The search did not resolve to a country/place."], actions: ["Search a town, street, airport, border crossing or neighbourhood instead."] },
      dataRules: ["Unresolved scans do not show land safety, crime or emergency infrastructure verdicts."]
    };
  }

  const [weather, infrastructure, wiki, indicators, advisory, localCrime] = await Promise.all([
    withTimeout(weatherAt(lat, lng), 2500, { current: null, source: "weather timeout" }),
    withTimeout(nearbyInfrastructure(lat, lng, radiusKm), 5500, { items: [], counts: {}, nearestByType: {}, source: "Overpass timeout", radiusKm, radiusMiles: radiusMi, timeout: true }),
    withTimeout(wikiPlace([q, place.city || place.name || target.name, place.country].filter(Boolean).join(", ")), 3000, { found: false, source: "Wikipedia timeout" }),
    country ? withTimeout(getCountryIndicators(country.iso2), 3000, {}) : Promise.resolve({}),
    country ? withTimeout(fcdoAdvice(country), 3000, { available: false, level: "not loaded" }) : Promise.resolve({ available: false }),
    country && country.iso2 === "GB" ? withTimeout(ukCrimeRadius(lat, lng, radiusKm), 4500, { available: false, source: "data.police.uk timeout" }) : Promise.resolve({ available: false, source: "No official local crime feed connected for this country" })
  ]);

  const nearbyAll = sortEventsByDistance((state.events || []).filter(e => wantedKind(filter, e)).filter(e => !(e.subtype === "earthquake" && Number(e.magnitude || 0) < 5)), lat, lng, 150);
  const insideEvents = nearbyAll.filter(e => e.distanceKm <= radiusKm).slice(0, 40);
  const nearEvents = nearbyAll.filter(e => e.distanceKm > radiusKm && e.distanceKm <= Math.max(radiusKm * 3, 40)).slice(0, 40);
  const verdict = verdictFromSignals({ country, localCrime, insideEvents, nearEvents, infrastructure, advisory, weather });
  const infraSummary = groupInfrastructure(infrastructure);
  const areaMetrics = estimateAreaMetrics({ localCrime, indicators, infrastructure, insideEvents, nearEvents, weather, advisory });

  return {
    ok: true,
    query: q,
    filter: filter || "all",
    radiusMiles: radiusMi,
    radiusKm,
    target: { ...target, lat, lng },
    place,
    country,
    verdict,
    areaMetrics,
    infrastructure,
    infrastructureSummary: infraSummary,
    localCrime,
    weather,
    wiki,
    indicators,
    advisory,
    insideEvents,
    nearEvents,
    dataRules: [
      "Radius scan uses the searched location as the centre point and draws a visible circle on the map.",
      "Infrastructure comes from OpenStreetMap/Overpass and depends on local mapping completeness.",
      "UK local crime uses official data.police.uk. Other countries use national/live/estimated context until a local official feed is connected.",
      "The verdict uses public-source signals and estimated values where direct local data is unavailable; it is not a guarantee of personal safety.",
      "Estimated values are labelled ESTIMATE and are based only on loaded public-source signals.",
      "Missing direct data is shown as missing rather than silently treated as safe."
    ]
  };
}

module.exports = { runAreaScan, REQUIRED_INFRA };
