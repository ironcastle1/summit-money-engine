import { disclosure } from './source-state.js';
import { uniqueText } from './text.js';
export function evidenceLedger(signals = []) {
  const records = signals.map(signal => Object.freeze({
    signalId: signal.id,
    title: signal.title,
    state: signal.sourceState,
    disclosure: disclosure(signal.sourceState),
    sources: Object.freeze(uniqueText(signal.sources || [])),
    confidence: signal.attention?.confidence?.score ?? signal.confidence,
    time: signal.time
  }));
  const sources = new Map();
  for (const record of records) for (const source of record.sources) sources.set(source, (sources.get(source) || 0) + 1);
  return Object.freeze({ records: Object.freeze(records), sources: Object.freeze([...sources.entries()].map(([name, count]) => Object.freeze({ name, count })).sort((a, b) => b.count - a.count)) });
}
