const { refreshState } = require("../core/stateStore");
const { haversineKm } = require("../core/geo");
const { searchPlaces, reverseGeocode, nearbyInfrastructure, wikiPlace } = require("../collectors/placeCollectors");
const { ukCrimeAt } = require("../collectors/policeUkCollector");
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

  if (hospitalLike) {
    confidence += 1;
    reasons.push(`${hospitalLike} hospital/clinic item${hospitalLike === 1 ? "" : "s"} found in radius`);
  } else {
    danger += 6;
    reasons.push("no hospital or clinic found in the scan radius from OSM");
  }
  if (!police) reasons.push("no police station found in the scan radius from OSM");
  if (!pharmacy) reasons.push("no pharmacy found in the scan radius from OSM");
  if (!fuel) reasons.push("no fuel station found in the scan radius from OSM");
  if (!road) reasons.push("no main road segment found in the scan radius from OSM");

  if (insideWar || insideTerror) actions.push("Do not move until the source and exact location are checked.");
  if (advisory && String(advisory.level || "").toLowerCase().includes("avoid")) actions.push("Treat official travel advice as the controlling warning.");
  actions.push("Check the nearest hospital, police station, main road and fuel point before moving.");
  actions.push("Use this as a public-source scan, not a guarantee of safety.");

  let verdict = "UNKNOWN";
  if (danger >= 70) verdict = "AVOID";
  else if (danger >= 38) verdict = "CAUTION";
  else if (confidence >= 2) verdict = "SAFE";

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

async function runAreaScan({ query, radiusMiles }) {
  const q = clean(query);
  if (!q) throw new Error("Search area required");

  const radiusMi = Math.max(0.5, Math.min(50, Number(radiusMiles) || 5));
  const radiusKm = milesToKm(radiusMi);

  const places = await searchPlaces(q);
  const target = places[0];
  if (!target) return { ok: false, error: "No place found", query: q, radiusMiles: radiusMi, radiusKm };

  const lat = Number(target.lat);
  const lng = Number(target.lng);
  const state = await refreshState(false);
  const place = await reverseGeocode(lat, lng);
  const country = byIso(place.countryCode) || byName(place.country);

  if (!country && !place.countryCode && !place.country) {
    return {
      ok: true,
      isOcean: true,
      query: q,
      radiusMiles: radiusMi,
      radiusKm,
      target: { ...target, lat, lng },
      place,
      verdict: { verdict: "UNKNOWN", danger: null, confidence: "ocean/no land country resolved", reasons: ["The search resolved to an ocean or non-land area."], actions: ["Search a town, street, airport, border crossing or neighbourhood instead."] },
      dataRules: ["Ocean scans do not show land safety, crime or emergency infrastructure verdicts."]
    };
  }

  const [weather, infrastructure, wiki, indicators, advisory, localCrime] = await Promise.all([
    weatherAt(lat, lng),
    nearbyInfrastructure(lat, lng, radiusKm),
    wikiPlace([place.name || target.name, place.city, place.country].filter(Boolean).join(", ")),
    country ? getCountryIndicators(country.iso2) : Promise.resolve({}),
    country ? fcdoAdvice(country) : Promise.resolve({ available: false }),
    country && country.iso2 === "GB" ? ukCrimeAt(lat, lng) : Promise.resolve({ available: false, source: "No official local crime feed connected for this country" })
  ]);

  const nearbyAll = sortEventsByDistance(state.events || [], lat, lng, 150);
  const insideEvents = nearbyAll.filter(e => e.distanceKm <= radiusKm).slice(0, 40);
  const nearEvents = nearbyAll.filter(e => e.distanceKm > radiusKm && e.distanceKm <= Math.max(radiusKm * 3, 40)).slice(0, 40);
  const verdict = verdictFromSignals({ country, localCrime, insideEvents, nearEvents, infrastructure, advisory, weather });
  const infraSummary = groupInfrastructure(infrastructure);

  return {
    ok: true,
    query: q,
    radiusMiles: radiusMi,
    radiusKm,
    target: { ...target, lat, lng },
    place,
    country,
    verdict,
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
      "UK local crime uses official data.police.uk. Other countries show no local crime feed unless connected later.",
      "The verdict uses public-source signals; it is not a guarantee of personal safety.",
      "Missing data is shown as missing, not converted into fake precision."
    ]
  };
}

module.exports = { runAreaScan, REQUIRED_INFRA };
