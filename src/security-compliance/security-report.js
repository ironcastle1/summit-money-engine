import { controlsForFramework } from './framework-mapping.js';

export function frameworkReport(frameworkId, snapshot = {}) {
  const mappings = controlsForFramework(frameworkId);
  const byControl = new Map((snapshot.assessments || []).map(item => [item.controlId, item]));
  const rows = mappings.map(mapping => ({
    controlId: mapping.controlId,
    references: mapping.references,
    state: byControl.get(mapping.controlId)?.state || 'NOT_ASSESSED',
    score: byControl.get(mapping.controlId)?.score || 0,
    evidenceIds: byControl.get(mapping.controlId)?.evidenceIds || []
  }));
  return Object.freeze({ frameworkId: String(frameworkId || '').toUpperCase(), generatedAt: new Date().toISOString(), rows: Object.freeze(rows), assessed: rows.filter(row => row.state !== 'NOT_ASSESSED').length, total: rows.length });
}
