function clamp(value, min, max) {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return Math.max(min, Math.min(max, n));
}
function countEvents(events, country, kind) {
  const c = String(country || "").toLowerCase().trim();
  return (events || []).filter(e => {
    const ec = String(e.country || "").toLowerCase().trim();
    return (!kind || e.kind === kind) && c && ec === c;
  }).length;
}
function countAny(events, kind) {
  return (events || []).filter(e => !kind || e.kind === kind).length;
}
function crimeScore(localCrime, homicide) {
  if (localCrime && localCrime.available && Number.isFinite(Number(localCrime.total))) {
    const total = Number(localCrime.total);
    const samples = Math.max(1, Number(localCrime.samplePoints || 1));
    const perSample = total / samples;
    const burglary = Number(localCrime.categories && (localCrime.categories.burglary || localCrime.categories["burglary"] || 0));
    const violent = Number(localCrime.categories && ((localCrime.categories["violent-crime"] || 0) + (localCrime.categories["violence-and-sexual-offences"] || 0) + (localCrime.categories["possession-of-weapons"] || 0)));
    const localPressure = Math.sqrt(Math.max(0, perSample)) * 2.2 + Math.sqrt(Math.max(0, burglary)) * 1.6 + Math.sqrt(Math.max(0, violent)) * 1.2;
    const value = clamp(Math.round((88 - localPressure) / 5) * 5, 35, 88);
    return { value, label: perSample < 35 ? "lower local police count" : perSample < 130 ? "normal urban crime pressure" : "elevated local crime pressure", dataLevel: "local official", source: localCrime.source, raw: `${total} records from ${samples} local sample points`, burglary, violent, perSample: Math.round(perSample) };
  }
  if (homicide && Number.isFinite(Number(homicide.value))) {
    const rate = Number(homicide.value);
    return { value: clamp(Math.round((88 - rate * 4.5) / 5) * 5, 20, 86), label: rate < 2 ? "lower national homicide" : rate < 8 ? "moderate national homicide" : "higher national homicide", dataLevel: "national official", source: homicide.source, raw: `${rate.toFixed(1)} homicide rate per 100k` };
  }
  return { value: 58, label: "estimated: no official local crime feed", dataLevel: "estimated", source: "no direct local crime source", raw: "Estimated from public security context, not official local crime" };
}
function buildRisk({ place, country, events, countryEvents, indicators, localCrime, weather, advisory }) {
  const countryName = country && country.name || place.country || "";
  const nearby = events || [];
  const countrySet = countryEvents || [];
  const warHits = countAny(nearby, "war");
  const terrorHits = countAny(nearby, "terror");
  const crisisHits = countAny(nearby, "crisis");
  const politicsHits = countAny(nearby, "politics");
  const movementHits = countAny(nearby, "movement");
  const crimeHits = countAny(nearby, "crime");
  const countryWarHits = countEvents(countrySet, countryName, "war");
  const countryTerrorHits = countEvents(countrySet, countryName, "terror");
  const countryCrisisHits = countEvents(countrySet, countryName, "crisis");
  const crime = crimeScore(localCrime, indicators && indicators.homicide);
  const weatherRisk = weather && weather.current ? ((weather.current.gustKmh || 0) > 70 ? 20 : 0) + ((weather.current.precipitationMm || 0) > 20 ? 12 : 0) : 0;
  const governancePenalty = indicators && indicators.politicalStability && Number.isFinite(indicators.politicalStability.value) ? clamp((0 - Number(indicators.politicalStability.value)) * 10, 0, 25) || 0 : 0;
  const advisoryPenalty = advisory && advisory.level && advisory.level.includes("avoid") ? 35 : advisory && advisory.level && advisory.level.includes("essential") ? 22 : 0;
  const danger = warHits * 24 + terrorHits * 20 + crimeHits * 8 + crisisHits * 8 + politicsHits * 5 + movementHits * 3 + countryWarHits * 4 + countryTerrorHits * 4 + countryCrisisHits * 2 + weatherRisk + governancePenalty + advisoryPenalty;
  const safetyValue = clamp(Math.round(((crime.value === null ? 65 : crime.value) - danger * 0.22) / 5) * 5, 10, 90);
  const verdict = safetyValue >= 75 ? "GO" : safetyValue >= 55 ? "CAUTION" : safetyValue >= 35 ? "HIGH RISK" : "AVOID";
  return {
    verdict,
    safety: { value: safetyValue, label: verdict, dataLevel: mixLevel([crime.dataLevel, "live-event", advisory && advisory.confidence]), source: "crime + events + advisory + weather" },
    crime,
    war: { value: clamp(warHits * 24 + countryWarHits * 6, 0, 100), label: warHits ? `${warHits} nearby conflict hits` : countryWarHits ? `${countryWarHits} country conflict hits` : "no nearby conflict hits", dataLevel: warHits ? "nearby live-event" : countryWarHits ? "country live-event" : "none loaded", source: "GDELT/ReliefWeb" },
    terror: { value: clamp(terrorHits * 22 + countryTerrorHits * 5, 0, 100), label: terrorHits ? `${terrorHits} nearby terror hits` : countryTerrorHits ? `${countryTerrorHits} country terror hits` : "no nearby terror hits", dataLevel: terrorHits ? "nearby live-event" : countryTerrorHits ? "country live-event" : "none loaded", source: "GDELT" },
    politics: { value: clamp(politicsHits * 12 + governancePenalty, 0, 100), label: politicsHits ? `${politicsHits} live politics hits` : governancePenalty ? "governance risk" : "no live politics hits", dataLevel: "mixed", source: "GDELT + World Bank" },
    crisis: { value: clamp(crisisHits * 14 + countryCrisisHits * 3 + weatherRisk, 0, 100), label: crisisHits ? `${crisisHits} nearby crisis hits` : countryCrisisHits ? `${countryCrisisHits} country crisis hits` : weatherRisk ? "weather disruption risk" : "no nearby crisis hits", dataLevel: crisisHits ? "nearby live-event" : countryCrisisHits ? "country live-event" : "none loaded", source: "USGS/GDACS/EONET/Open-Meteo" },
    movement: { value: clamp(movementHits * 12, 0, 100), label: movementHits ? `${movementHits} movement disruption hits` : "no live movement hits", dataLevel: "live-event", source: "GDELT/RSS" },
    crimeNews: { value: clamp(crimeHits * 15, 0, 100), label: crimeHits ? `${crimeHits} nearby crime/security news hits` : "no nearby crime news hits", dataLevel: "live-event", source: "strict security/crime RSS" }
  };
}
function mixLevel(levels) {
  const s = levels.filter(Boolean).join("+");
  if (s.includes("local")) return "local+national+live";
  if (s.includes("national")) return "national+live";
  return "live/estimated";
}
function marketSignals(markets, events) {
  return (markets || []).filter(m => Number.isFinite(Number(m.changePct)) && Number.isFinite(Number(m.price))).map(m => {
    const related = relatedEvents(m, events);
    const abs = Math.abs(Number(m.changePct));
    const score = clamp(abs * 11 + related * 10 + (Number(m.volume) > 100000000 ? 8 : 0), 0, 100);
    return { ...m, score, direction: m.changePct > 0.5 ? "up momentum" : m.changePct < -0.5 ? "down momentum" : "mixed", reason: [`${Number(m.changePct).toFixed(2)}% 24h move`, related ? `${related} related security/macro events` : "no related event spike", `${m.source} price feed`], invalidation: "price reverses below the prior 24h range or source feed fails" };
  }).sort((a, b) => b.score - a.score);
}
function relatedEvents(m, events) {
  const id = String(m.id || m.name || "").toLowerCase();
  const words = [id];
  if (/gold|silver|copper|oil|brent|wti|gas|wheat|corn|soy/.test(id)) words.push("war", "shipping", "energy", "oil", "gas", "suez", "hormuz", "strike", "storm");
  if (/btc|eth|sol|xrp|bnb|ada|doge|avax|link|dot/.test(id)) words.push("crypto", "sanction", "bank", "currency", "market", "risk");
  return (events || []).filter(e => words.some(w => `${e.title} ${e.summary} ${e.kind}`.toLowerCase().includes(w))).length;
}
module.exports = { buildRisk, marketSignals, countEvents, clamp };
