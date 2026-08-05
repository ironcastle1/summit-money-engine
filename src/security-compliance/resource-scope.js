import { unique } from './utilities.js';

export function resourceScope(resource = {}) {
  return Object.freeze({
    tenantId: String(resource.tenantId || ''),
    workspaceId: String(resource.workspaceId || ''),
    classification: String(resource.classification || 'INTERNAL').toUpperCase(),
    countries: Object.freeze(unique(resource.countries || []).map(value => String(value).toUpperCase())),
    teams: Object.freeze(unique(resource.teams || [])),
    ownerId: String(resource.ownerId || '')
  });
}

export function intersectsScope(subject = {}, scope = {}) {
  if (scope.workspaceId && subject.workspaceIds?.length && !subject.workspaceIds.includes(scope.workspaceId)) return false;
  if (scope.teams?.length && subject.teamIds?.length && !scope.teams.some(team => subject.teamIds.includes(team))) return false;
  return true;
}
