import { sourceLedger } from './source-attribution.js';

export function numberedFootnotes(sources = []) {
  return sourceLedger(sources).map((source, index) => Object.freeze({
    number: index + 1,
    sourceId: source.id,
    text: [source.name, source.publishedAt ? new Date(source.publishedAt).toISOString().slice(0, 10) : '', source.url].filter(Boolean).join(' · ')
  }));
}
