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
    return { value: clamp(100 - total * 1.8, 5, 95), label: total < 20 ? "lower local police count" : total < 70 ? "moderate local police count" : "higher local police count", dataLevel: "local", source: localCrime.source, raw: `${total} local records` };
  }
  if (homicide && Number.isFinite(Number(homicide.value))) {
    const rate = Number(homicide.value);
    return { value: clamp(100 - rate * 7.5, 4, 92), label: rate < 2 ? "lower national homicide" : rate < 8 ? "moderate national homicide" : "higher national homicide", dataLevel: "national", source: homicide.source, raw: `${rate.toFixed(1)} homicide rate per 100k` };
  }
  return { value: 55, label: "estimated: no local crime feed", dataLevel: "estimated", source: "no local crime source, using context", raw: "Estimated from public risk context, not official local crime" };
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
  const countryWarHits = countEvents(countrySet, countryName, "war");
  const countryTerrorHits = countEvents(countrySet, countryName, "terror");
  const countryCrisisHits = countEvents(countrySet, countryName, "crisis");
  const crime = crimeScore(localCrime, indicators && indicators.homicide);
  const weatherRisk = weather && weather.current ? ((weather.current.gustKmh || 0) > 70 ? 20 : 0) + ((weather.current.precipitationMm || 0) > 20 ? 12 : 0) : 0;
  const governancePenalty = indicators && indicators.politicalStability && Number.isFinite(indicators.politicalStability.value) ? clamp((0 - Number(indicators.politicalStability.value)) * 10, 0, 25) || 0 : 0;
  const advisoryPenalty = advisory && advisory.level && advisory.level.includes("avoid") ? 35 : advisory && advisory.level && advisory.level.includes("essential") ? 22 : 0;
  const danger = warHits * 24 + terrorHits * 20 + crisisHits * 10 + politicsHits * 5 + movementHits * 4 + countryWarHits * 6 + countryTerrorHits * 5 + countryCrisisHits * 3 + weatherRisk + governancePenalty + advisoryPenalty;
  const safetyValue = clamp((crime.value === null ? 65 : crime.value) - danger * 0.42, 1, 98);
  const verdict = safetyValue >= 75 ? "GO" : safetyValue >= 55 ? "CAUTION" : safetyValue >= 35 ? "HIGH RISK" : "AVOID";
  return {
    verdict,
    safety: { value: safetyValue, label: verdict, dataLevel: mixLevel([crime.dataLevel, "live-event", advisory && advisory.confidence]), source: "crime + events + advisory + weather" },
    crime,
    war: { value: clamp(warHits * 24 + countryWarHits * 6, 0, 100), label: warHits ? `${warHits} nearby conflict hits` : countryWarHits ? `${countryWarHits} country conflict hits` : "no nearby conflict hits", dataLevel: warHits ? "nearby live-event" : countryWarHits ? "country live-event" : "none loaded", source: "GDELT/ReliefWeb" },
    terror: { value: clamp(terrorHits * 22 + countryTerrorHits * 5, 0, 100), label: terrorHits ? `${terrorHits} nearby terror hits` : countryTerrorHits ? `${countryTerrorHits} country terror hits` : "no nearby terror hits", dataLevel: terrorHits ? "nearby live-event" : countryTerrorHits ? "country live-event" : "none loaded", source: "GDELT" },
    politics: { value: clamp(politicsHits * 12 + governancePenalty, 0, 100), label: politicsHits ? `${politicsHits} live politics hits` : governancePenalty ? "governance risk" : "no live politics hits", dataLevel: "mixed", source: "GDELT + World Bank" },
    crisis: { value: clamp(crisisHits * 14 + countryCrisisHits * 3 + weatherRisk, 0, 100), label: crisisHits ? `${crisisHits} nearby crisis hits` : countryCrisisHits ? `${countryCrisisHits} country crisis hits` : weatherRisk ? "weather disruption risk" : "no nearby crisis hits", dataLevel: crisisHits ? "nearby live-event" : countryCrisisHits ? "country live-event" : "none loaded", source: "USGS/GDACS/EONET/Open-Meteo" },
    movement: { value: clamp(movementHits * 12, 0, 100), label: movementHits ? `${movementHits} movement disruption hits` : "no live movement hits", dataLevel: "live-event", source: "GDELT" }
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
