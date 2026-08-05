export const SHIPPING_SOURCE_STATES = Object.freeze({
  STARTING: 'STARTING', ONLINE: 'ONLINE', DEGRADED: 'DEGRADED', OFFLINE: 'OFFLINE', NOT_CONFIGURED: 'NOT_CONFIGURED'
});

export const PORT_TYPES = Object.freeze(['gateway', 'hub', 'transshipment', 'energy', 'bulk', 'industrial', 'canal', 'strait']);
export const DISRUPTION_CATEGORIES = Object.freeze(new Set(['conflict', 'terror', 'storm', 'flood', 'earthquake', 'volcano', 'wildfire', 'infrastructure', 'transport', 'energy', 'protest']));
export const SHIPPING_KEYWORDS = Object.freeze(['port', 'shipping', 'vessel', 'freight', 'container', 'tanker', 'canal', 'strait', 'terminal', 'cargo', 'maritime', 'supply chain']);
export const RISK_BANDS = Object.freeze([
  { min: 80, id: 'CRITICAL' }, { min: 60, id: 'HIGH' }, { min: 40, id: 'ELEVATED' }, { min: 20, id: 'GUARDED' }, { min: 0, id: 'LOW' }
]);
