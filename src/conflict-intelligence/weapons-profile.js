import {
  includesAny,
  uniqueText
}
from './text.js';
const RULES = Object.freeze({
  CBRN: ['chemical weapon',
  'biological weapon',
  'radiological',
  'nuclear weapon'],
  MISSILE: ['missile',
  'rocket',
  'ballistic',
  'cruise missile'],
  DRONE: ['drone',
  'uav',
  'loitering munition'],
  AIRCRAFT: ['aircraft',
  'warplane',
  'helicopter',
  'airstrike'],
  ARTILLERY: ['artillery',
  'shelling',
  'mortar',
  'howitzer'],
  ARMOUR: ['tank',
  'armoured',
  'armored vehicle'],
  NAVAL: ['warship',
  'frigate',
  'destroyer',
  'submarine',
  'naval'],
  CYBER: ['cyberattack',
  'malware',
  'ddos'],
  SMALL_ARMS: ['rifle',
  'small arms',
  'gunfire']
});
export function detectWeapons(event = {
}) {
  const explicit = event.attributes?.weapons || event.weapons || [],
  text = `${event.title || ''} ${event.attributes?.description || ''}`;
  const classes = [];
  for (const [kind,
  terms] of Object.entries(RULES))
  if (includesAny(text,
  terms))
  classes.push(kind);
  for (const item of explicit)
  classes.push(String(item).toUpperCase());
  return uniqueText(classes.length ? classes : ['UNKNOWN'],
  32);
}
export function strategicWeaponFlag(classes = []) {
  return classes.some(value => ['CBRN',
  'MISSILE'].includes(value));
}
