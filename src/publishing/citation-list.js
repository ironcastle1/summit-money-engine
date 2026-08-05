import { numberedFootnotes } from './footnotes.js';

export function citationList(edition, sources = []) {
  const selected = sources.filter(source => (edition.sourceIds || []).includes(source.id || source.sourceId));
  return Object.freeze(numberedFootnotes(selected));
}
