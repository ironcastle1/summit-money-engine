import { contentBlockRecord } from './content-block-schema.js';
import { clean, frozen } from './utilities.js';

function summaryBlock(snapshot = {}) {
  const summary = snapshot.executiveSummary || snapshot.summary || {};
  return contentBlockRecord({
    type: 'EXECUTIVE_SUMMARY',
    title: 'Executive summary',
    text: clean(summary.text || summary.headline || snapshot.brief?.headline || 'No executive summary available.', 12000),
    data: { priority: summary.priority || snapshot.priority || null }
  });
}

function findingsBlock(snapshot = {}) {
  const signals = snapshot.signals || snapshot.priorities || [];
  return contentBlockRecord({
    type: 'KEY_FINDINGS',
    title: 'Key findings',
    data: { items: signals.slice(0, 12).map(item => ({ id: item.id, title: item.title, priority: item.priority?.score ?? item.score ?? 0, summary: item.summary || item.explanation || '' })) },
    sourceIds: signals.flatMap(item => item.sourceIds || [])
  }, 1);
}

function recommendationsBlock(snapshot = {}) {
  const recommendations = snapshot.recommendations || snapshot.actions || [];
  return contentBlockRecord({
    type: 'RECOMMENDATIONS',
    title: 'Recommended actions',
    data: { items: recommendations.slice(0, 20) }
  }, 2);
}

export function blocksFromDecisionSnapshot(snapshot = {}, input = {}) {
  const blocks = [summaryBlock(snapshot), findingsBlock(snapshot), recommendationsBlock(snapshot)];
  if ((snapshot.timeline || []).length) blocks.push(contentBlockRecord({ type: 'TIMELINE', title: 'Timeline', data: { items: snapshot.timeline.slice(0, 100) } }, blocks.length));
  if ((snapshot.evidence || snapshot.ledger || []).length) blocks.push(contentBlockRecord({ type: 'EVIDENCE', title: 'Evidence', data: { items: (snapshot.evidence || snapshot.ledger).slice(0, 200) } }, blocks.length));
  if (input.includeSources !== false) blocks.push(contentBlockRecord({ type: 'SOURCES', title: 'Sources', data: { sourceIds: snapshot.sourceIds || [] }, sourceIds: snapshot.sourceIds || [] }, blocks.length));
  return frozen(blocks);
}

export function composeEditionContent(input = {}) {
  if (input.blocks?.length) return frozen(input.blocks.map(contentBlockRecord));
  if (input.snapshot) return blocksFromDecisionSnapshot(input.snapshot, input);
  return frozen([contentBlockRecord({ type: 'TEXT', title: 'Briefing', text: clean(input.text || 'No content supplied.', 100000) })]);
}
