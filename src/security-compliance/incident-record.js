import { securityId } from './ids.js';
import { incidentSeverity } from './incident-severity.js';
import { iso } from './time.js';
import { clean, unique } from './utilities.js';

export function incidentRecord(input = {}) {
  const calculated = incidentSeverity(input);
  const declaredAt = iso(input.declaredAt);
  return Object.freeze({
    id: input.id || securityId('incident', input.title),
    tenantId: clean(input.tenantId, 190),
    title: clean(input.title, 300),
    summary: clean(input.summary, 3000),
    severity: clean(input.severity || calculated.severity, 20).toUpperCase(),
    severityScore: calculated.score,
    state: clean(input.state || 'DECLARED', 40).toUpperCase(),
    commanderId: clean(input.commanderId, 190),
    affectedSystems: Object.freeze(unique(input.affectedSystems || [])),
    affectedRegions: Object.freeze(unique(input.affectedRegions || [])),
    regulatedData: Boolean(input.regulatedData),
    affectedUsers: Math.max(0, Number(input.affectedUsers) || 0),
    timeline: Object.freeze(input.timeline || []),
    declaredAt,
    containedAt: input.containedAt ? iso(input.containedAt) : null,
    resolvedAt: input.resolvedAt ? iso(input.resolvedAt) : null,
    createdAt: declaredAt,
    updatedAt: iso()
  });
}
