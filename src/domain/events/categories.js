export const EVENT_CATEGORIES = Object.freeze([
  'earthquake',
  'volcano',
  'wildfire',
  'storm',
  'flood',
  'drought',
  'landslide',
  'ice',
  'conflict',
  'protest',
  'terror',
  'crime',
  'infrastructure',
  'transport',
  'energy',
  'economic',
  'health',
  'other'
]);

const ALIASES = Object.freeze({
  earthquakes: 'earthquake',
  severeStorms: 'storm',
  severe_storms: 'storm',
  tropicalCyclones: 'storm',
  tropical_cyclone: 'storm',
  wildfires: 'wildfire',
  floods: 'flood',
  volcanoes: 'volcano',
  droughts: 'drought',
  landslides: 'landslide',
  seaLakeIce: 'ice',
  snow: 'ice',
  conflict_event: 'conflict',
  civil_unrest: 'protest',
  terrorism: 'terror',
  accident: 'infrastructure'
});

export function normalizeCategory(value) {
  const raw = String(value || 'other').trim();
  const compact = raw.replace(/[\s-]+/g, '_');
  const direct = ALIASES[raw] || ALIASES[compact];
  if (direct) return direct;
  const lower = compact.toLowerCase();
  if (EVENT_CATEGORIES.includes(lower)) return lower;
  if (lower.includes('earthquake')) return 'earthquake';
  if (lower.includes('volcan')) return 'volcano';
  if (lower.includes('wildfire') || lower.includes('fire')) return 'wildfire';
  if (lower.includes('storm') || lower.includes('cyclone') || lower.includes('hurricane') || lower.includes('typhoon')) return 'storm';
  if (lower.includes('flood')) return 'flood';
  if (lower.includes('drought')) return 'drought';
  if (lower.includes('landslide')) return 'landslide';
  if (lower.includes('ice') || lower.includes('snow')) return 'ice';
  if (lower.includes('conflict') || lower.includes('war')) return 'conflict';
  if (lower.includes('protest') || lower.includes('unrest')) return 'protest';
  if (lower.includes('terror')) return 'terror';
  if (lower.includes('crime')) return 'crime';
  if (lower.includes('transport') || lower.includes('aviation') || lower.includes('maritime')) return 'transport';
  if (lower.includes('power') || lower.includes('energy') || lower.includes('oil') || lower.includes('gas')) return 'energy';
  if (lower.includes('health') || lower.includes('disease') || lower.includes('epidemic')) return 'health';
  return 'other';
}
