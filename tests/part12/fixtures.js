import { normalizeSignal } from '../../src/decision-support/signal-normalizer.js';
export function fixtureSignals(now = Date.now()) {
  return [
    normalizeSignal({ id: 'war-1', domain: 'CONFLICT', title: 'Frontline activity increases near corridor', summary: 'Multiple independent sources report increased shelling.', severity: 86, confidence: 82, sourceState: 'CORROBORATED', sources: ['Source A','Source B'], location: { lat: 31.5, lon: 34.5, label: 'Eastern Mediterranean' }, time: new Date(now - 2 * 3600000), action: 'Review route and civilian exposure.' }),
    normalizeSignal({ id: 'hazard-1', domain: 'HAZARDS', title: 'Major cyclone threatens export terminals', summary: 'Forecast track intersects two ports.', severity: 78, confidence: 76, sourceState: 'MEASURED', sources: ['Weather agency'], location: { lat: 18.2, lon: 72.8, label: 'Arabian Sea' }, time: new Date(now - 4 * 3600000), action: 'Prepare alternative routing.' }),
    normalizeSignal({ id: 'market-1', domain: 'MARKETS', title: 'Energy volatility expands', summary: 'Oil volatility and freight risk are rising together.', severity: 67, confidence: 71, sourceState: 'MEASURED', sources: ['Market feed'], time: new Date(now - 1 * 3600000), action: 'Review energy exposure.' }),
    normalizeSignal({ id: 'country-1', domain: 'COUNTRIES', title: 'Election contestation risk rises', severity: 61, confidence: 58, sourceState: 'INFERRED', sources: ['Country model'], location: { lat: 6.5, lon: 3.4, label: 'Nigeria' }, time: new Date(now - 30 * 3600000) })
  ];
}
