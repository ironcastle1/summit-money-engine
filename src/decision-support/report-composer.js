import { reportTemplate } from './report-template.js';
import { recommendations } from './recommendation-engine.js';

function reportSection(title, items, options = {}) {
  return Object.freeze({
    id: String(options.id || title).toUpperCase().replace(/[^A-Z0-9]+/g, '_'),
    title,
    description: options.description || '',
    count: items.length,
    items: Object.freeze(items)
  });
}

function operationalSections(snapshot, template) {
  const sourceSections = snapshot.brief?.sections || [];
  const byTitle = new Map(sourceSections.map(section => [String(section.title || section.id).toUpperCase(), section]));
  return Object.freeze(template.sections.map(title => {
    const key = title.toUpperCase();
    if (key.includes('EXECUTIVE')) return reportSection(title, snapshot.brief?.executive ? [snapshot.brief.executive] : []);
    if (key.includes('ACTION')) return reportSection(title, snapshot.brief?.actions || []);
    if (key.includes('EVIDENCE') || key.includes('GAP')) return reportSection(title, snapshot.brief?.gaps?.items || []);
    if (key.includes('TIMELINE')) return reportSection(title, snapshot.timeline?.items || snapshot.timeline || []);
    if (key.includes('DECISION')) return reportSection(title, snapshot.decisions || []);
    if (key.includes('TASK')) return reportSection(title, snapshot.tasks || []);
    const match = [...byTitle.entries()].find(([sectionTitle]) => key.includes(sectionTitle) || sectionTitle.includes(key));
    return reportSection(title, match?.[1]?.items || []);
  }));
}

function qualityGate(snapshot) {
  const coverage = Number(snapshot.brief?.coverage?.score || snapshot.brief?.coverage?.percent || 0);
  const gapCount = Number(snapshot.brief?.gaps?.count || snapshot.brief?.gaps?.items?.length || 0);
  const critical = Number(snapshot.brief?.totals?.critical || 0);
  const warnings = [];
  if (coverage < 50) warnings.push('Evidence coverage is below 50%.');
  if (gapCount > 10) warnings.push(`${gapCount} evidence gaps remain open.`);
  if (critical > 0) warnings.push(`${critical} critical signals require explicit acknowledgement.`);
  return Object.freeze({
    ready: coverage >= 50 && gapCount <= 25,
    coverage,
    gapCount,
    critical,
    warnings: Object.freeze(warnings)
  });
}

export function composeReport(snapshot, input = {}) {
  const template = reportTemplate(input.type);
  const generatedAt = new Date(input.now || Date.now()).toISOString();
  const reportRecommendations = recommendations(snapshot, { limit: input.recommendationLimit || 15 });
  return Object.freeze({
    id: String(input.id || `report-${Date.now()}`),
    type: template.id,
    title: String(input.title || template.title),
    subtitle: String(input.subtitle || ''),
    classification: String(input.classification || 'INTERNAL').toUpperCase(),
    status: String(input.status || 'DRAFT').toUpperCase(),
    generatedAt,
    generatedBy: String(input.generatedBy || input.owner || 'Merlin'),
    reportingWindow: Object.freeze({
      start: input.start || null,
      end: input.end || generatedAt,
      timezone: input.timezone || 'UTC'
    }),
    executive: snapshot.brief?.executive || null,
    readiness: snapshot.brief?.readiness || null,
    scorecard: snapshot.scorecard || null,
    sections: operationalSections(snapshot, template),
    recommendations: reportRecommendations,
    evidence: snapshot.evidence || null,
    gaps: snapshot.brief?.gaps || null,
    qualityGate: qualityGate(snapshot),
    approvals: Object.freeze(input.approvals || []),
    distribution: Object.freeze(input.distribution || { classification: String(input.classification || 'INTERNAL').toUpperCase() }),
    metadata: Object.freeze({
      signalCount: snapshot.signals?.length || 0,
      watchHitCount: snapshot.alerts?.length || 0,
      escalationCount: snapshot.escalations?.length || 0,
      slaBreachCount: snapshot.operations?.slas?.breached || 0,
      template: template.id,
      sourceModes: snapshot.sourceBundleStatus || {}
    })
  });
}
