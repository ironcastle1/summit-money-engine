import {
  clamp,
  round
}
from './numbers.js';
import {
  clean,
  slug
}
from './text.js';
import {
  iso
}
from './time.js';
import {
  classifyConflictEvent
}
from './conflict-classifier.js';
import {
  detectWeapons
}
from './weapons-profile.js';
import {
  actorsFromEvent
}
from './actor-normalizer.js';
import {
  normalizeEvidence
}
from './evidence-normalizer.js';
const TYPE_BASE = {
  BATTLE: 55,
  AIRSTRIKE: 65,
  MISSILE_STRIKE: 72,
  DRONE_STRIKE: 60,
  SHELLING: 58,
  INCURSION: 70,
  TERROR_ATTACK: 74,
  SABOTAGE: 58,
  BLOCKADE: 62,
  MOBILIZATION: 48,
  CEASEFIRE: 10,
  CEASEFIRE_VIOLATION: 68,
  TERRITORIAL_CHANGE: 72,
  ARREST: 30,
  PROTEST: 28,
  OTHER: 35
};
function fatalities(input) {
  const value = Number(input.attributes?.fatalities ?? input.fatalities ?? 0);
  return Number.isFinite(value) ? Math.max(0,
  value) : 0;
}
export function normalizeConflictEvent(input,
now = Date.now()) {
  if (!input || !Number.isFinite(Number(input.lat)) || !Number.isFinite(Number(input.lon)))
  return null;
  const type = classifyConflictEvent(input),
  fatalityCount = fatalities(input),
  weapons = detectWeapons(input),
  actors = actorsFromEvent(input),
  text = `${input.title || ''} ${input.attributes?.description || ''}`.toLowerCase(),
  civilian = Boolean(input.attributes?.civilianTarget) || /civilian|hospital|school|refugee|aid convoy/.test(text),
  infrastructure = [...(input.attributes?.infrastructure || [])];
  for (const [term,
  kind] of [['power',
  'POWER'],
  ['pipeline',
  'ENERGY'],
  ['port',
  'PORT'],
  ['airport',
  'AIRPORT'],
  ['bridge',
  'BRIDGE'],
  ['rail',
  'RAIL'],
  ['hospital',
  'HEALTH'],
  ['school',
  'EDUCATION'],
  ['telecom',
  'TELECOM']])
  if (text.includes(term))
  infrastructure.push(kind);
  const base = TYPE_BASE[type] ?? 35,
  severity = clamp(base + Number(input.severity || 0) * 6 + Math.min(20,
  Math.log2(fatalityCount + 1) * 4) + (civilian ? 8 : 0) + (weapons.includes('CBRN') ? 20 : 0));
  const country = clean(input.country || input.attributes?.country || '',
  100) || null,
  region = clean(input.region || input.attributes?.region || '',
  120) || null;
  return Object.freeze({
    id: String(input.id || slug(`${input.source}-${input.title}-${input.time}`)),
    title: clean(input.title || 'Conflict event',
    240),
    type,
    category: String(input.category || 'conflict'),
    time: iso(input.time || input.updatedAt || now),
    updatedAt: iso(input.updatedAt || input.time || now),
    lat: round(input.lat,
    5),
    lon: round(input.lon,
    5),
    country,
    region,
    theatreId: slug(input.attributes?.theatreId || country || region || `${Math.round(Number(input.lat) / 5) * 5}-${Math.round(Number(input.lon) / 5) * 5}`),
    severity: round(severity,
    1),
    fatalities: fatalityCount,
    civilianTarget: civilian,
    crossBorder: Boolean(input.attributes?.crossBorder) || /cross-border|across the border|border incursion/.test(text),
    actors,
    weapons,
    infrastructure: [...new Set(infrastructure.map(String))],
    territorialChange: type === 'TERRITORIAL_CHANGE' || Boolean(input.attributes?.territorialChange),
    evidence: normalizeEvidence(input,
    now),
    sourceUrl: input.url || null,
    raw: input
  });
}
export function conflictEvents(inputs,
now = Date.now()) {
  return (inputs || []).map(event => normalizeConflictEvent(event,
  now)).filter(Boolean);
}
