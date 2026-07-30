export const INTELLIGENCE_LAYERS = Object.freeze(['COMPOSITE', 'SAFETY', 'CONFLICT', 'DISASTER', 'CRIME', 'ELECTION', 'ECONOMIC']);
export const CONFLICT_CATEGORIES = Object.freeze(new Set(['conflict', 'war', 'terror', 'terrorism', 'protest', 'civil-unrest']));
export const DISASTER_CATEGORIES = Object.freeze(new Set(['earthquake', 'wildfire', 'storm', 'flood', 'volcano', 'drought', 'disaster']));
export const SAFETY_BANDS = Object.freeze([
  { maximum: 20, id: 'LOW', label: 'LOW RISK' },
  { maximum: 40, id: 'GUARDED', label: 'GUARDED' },
  { maximum: 60, id: 'ELEVATED', label: 'ELEVATED' },
  { maximum: 80, id: 'HIGH', label: 'HIGH RISK' },
  { maximum: 100, id: 'SEVERE', label: 'SEVERE' }
]);
export const CRIME_WEIGHTS = Object.freeze({
  'violence-and-sexual-offences': 1, robbery: 0.9, 'possession-of-weapons': 0.9, burglary: 0.7,
  'criminal-damage-arson': 0.65, 'vehicle-crime': 0.55, 'public-order': 0.5, drugs: 0.45,
  shoplifting: 0.35, 'theft-from-the-person': 0.5, 'other-theft': 0.35, 'anti-social-behaviour': 0.25,
  'bicycle-theft': 0.25, 'other-crime': 0.4
});
