function clamp(value, min, max) {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return Math.max(min, Math.min(max, n));
}
function countEvents(events, country, kind) {
  const c = String(country || "").toLowerCase();
  return (events || []).filter(e => {
    const ec = String(e.country || "").toLowerCase();
    const ep = String(e.place || "").toLowerCase();
    return (!kind || e.kind === kind) && c && (ec.includes(c) || c.includes(ec) || ep.includes(c));
  }).length;
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
  return { value: null, label: "no crime source", dataLevel: "missing", source: "missing", raw: "No local/national crime data loaded" };
}
function buildRisk({ place, country, events, indicators, localCrime, weather, advisory }) {
  const countryName = country && country.name || place.country || "";
  const warHits = countEvents(events, countryName, "war");
  const terrorHits = countEvents(events, countryName, "terror");
  const crisisHits = countEvents(events, countryName, "crisis");
  const politicsHits = countEvents(events, countryName, "politics");
  const movementHits = countEvents(events, countryName, "movement");
  const crime = crimeScore(localCrime, indicators && indicators.homicide);
  const weatherRisk = weather && weather.current ? ((weather.current.gustKmh || 0) > 70 ? 20 : 0) + ((weather.current.precipitationMm || 0) > 20 ? 12 : 0) : 0;
  const governancePenalty = indicators && indicators.politicalStability && Number.isFinite(indicators.politicalStability.value) ? clamp((0 - Number(indicators.politicalStability.value)) * 10, 0, 25) || 0 : 0;
  const advisoryPenalty = advisory && advisory.level && advisory.level.includes("avoid") ? 35 : advisory && advisory.level && advisory.level.includes("essential") ? 22 : 0;
  const danger = warHits * 22 + terrorHits * 18 + crisisHits * 10 + politicsHits * 6 + movementHits * 4 + weatherRisk + governancePenalty + advisoryPenalty;
  const safetyValue = clamp((crime.value === null ? 65 : crime.value) - danger * 0.42, 1, 98);
  const verdict = safetyValue === null ? "UNKNOWN" : safetyValue >= 75 ? "GO" : safetyValue >= 55 ? "CAUTION" : safetyValue >= 35 ? "HIGH RISK" : "AVOID";
  return {
    verdict,
    safety: { value: safetyValue, label: verdict, dataLevel: mixLevel([crime.dataLevel, "live-event", advisory && advisory.confidence]), source: "crime + events + advisory + weather" },
    crime,
    war: { value: clamp(warHits * 22, 0, 100), label: warHits ? `${warHits} live conflict hits` : "no live conflict hits", dataLevel: "live-event", source: "GDELT/ReliefWeb" },
    terror: { value: clamp(terrorHits * 20, 0, 100), label: terrorHits ? `${terrorHits} live terror hits` : "no live terror hits", dataLevel: "live-event", source: "GDELT" },
    politics: { value: clamp(politicsHits * 12 + governancePenalty, 0, 100), label: politicsHits ? `${politicsHits} live politics hits` : governancePenalty ? "governance risk" : "no live politics hits", dataLevel: "mixed", source: "GDELT + World Bank" },
    crisis: { value: clamp(crisisHits * 14 + weatherRisk, 0, 100), label: crisisHits ? `${crisisHits} live crisis hits` : weatherRisk ? "weather disruption risk" : "no live crisis hits", dataLevel: "live-event", source: "USGS/GDACS/EONET/Open-Meteo" },
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
