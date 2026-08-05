import {
  CONFLICT_EVENT_TYPES,
  CONFLICT_PHASES,
  ESCALATION_LEVELS,
  WEAPON_CLASSES,
  SOURCE_STATES
}
from './constants.js';
import {
  CONFLICT_SCENARIOS
}
from './scenario-catalog.js';
export function conflictCatalog() {
  return Object.freeze({
    eventTypes: CONFLICT_EVENT_TYPES,
    phases: CONFLICT_PHASES,
    escalationLevels: ESCALATION_LEVELS,
    weapons: WEAPON_CLASSES,
    sourceStates: SOURCE_STATES,
    scenarios: CONFLICT_SCENARIOS,
    capabilities: Object.freeze(['theatre-ranking',
    'frontline-detection',
    'strike-analysis',
    'actor-graph',
    'force-posture',
    'ceasefire-monitoring',
    'escalation-ladder',
    'civilian-exposure',
    'infrastructure-exposure',
    'regional-contagion',
    'watchlists',
    'alerts',
    'map-features',
    'scenarios',
    'exports']),
    sourcePolicy: 'Measured and independently corroborated event records are preferred. Inferred, reference and unavailable evidence states are disclosed.'
  });
}
