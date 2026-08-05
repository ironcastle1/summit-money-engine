export const BRIEFING_SECTIONS = Object.freeze([
  'EXECUTIVE','CRITICAL','CONFLICT','HAZARDS','MARKETS','COUNTRIES','LOGISTICS','OPPORTUNITIES','WATCHLISTS','GAPS'
]);
export const PRIORITY_BANDS = Object.freeze([
  Object.freeze({ id: 'ROUTINE', minimum: 0, maximum: 34.99 }),
  Object.freeze({ id: 'WATCH', minimum: 35, maximum: 54.99 }),
  Object.freeze({ id: 'IMPORTANT', minimum: 55, maximum: 69.99 }),
  Object.freeze({ id: 'URGENT', minimum: 70, maximum: 84.99 }),
  Object.freeze({ id: 'CRITICAL', minimum: 85, maximum: 100 })
]);
export const SOURCE_STATES = Object.freeze(['MEASURED','CORROBORATED','INFERRED','REFERENCE','UNAVAILABLE']);
export const CASE_STATUSES = Object.freeze(['OPEN','MONITORING','ACTIONED','RESOLVED','ARCHIVED']);
export const TASK_STATUSES = Object.freeze(['OPEN','IN_PROGRESS','BLOCKED','DONE','CANCELLED']);
export const DECISION_STATUSES = Object.freeze(['PROPOSED','APPROVED','REJECTED','SUPERSEDED','COMPLETED']);
export const WORKSPACE_LIMITS = Object.freeze({ workspaces: 250, cases: 500, notes: 2000, tasks: 2000, decisions: 1000 });
export const REPORT_FORMATS = Object.freeze(['EXECUTIVE','MORNING','SHIFT_HANDOVER','INCIDENT','MARKET','COUNTRY','ROUTE']);
