import { clamp, round } from '../../core/numbers.js';

function value(indicators, key) { const item = indicators?.[key]; return Number.isFinite(Number(item?.value)) ? Number(item.value) : null; }
export function economicProfile(indicators = {}) {
  const inflation = value(indicators, 'inflationPct');
  const unemployment = value(indicators, 'unemploymentPct');
  const internet = value(indicators, 'internetPct');
  const trade = value(indicators, 'tradePctGdp');
  const gdpPerCapita = value(indicators, 'gdpPerCapitaUsd');
  const stressParts = [];
  if (inflation !== null) stressParts.push(clamp(inflation / 20 * 100, 0, 100));
  if (unemployment !== null) stressParts.push(clamp(unemployment / 25 * 100, 0, 100));
  const stressScore = stressParts.length ? round(stressParts.reduce((a, b) => a + b, 0) / stressParts.length, 1) : null;
  const digitalScore = internet === null ? null : round(clamp(internet, 0, 100), 1);
  const opennessScore = trade === null ? null : round(clamp(trade / 150 * 100, 0, 100), 1);
  return Object.freeze({ stressScore, digitalScore, opennessScore, gdpPerCapitaUsd: gdpPerCapita, indicators });
}
