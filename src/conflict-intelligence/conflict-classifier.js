import {
  includesAny
}
from './text.js';
const RULES = Object.freeze([
['CEASEFIRE_VIOLATION',
['ceasefire violation',
'truce violation',
'broke ceasefire']],
['CEASEFIRE',
['ceasefire',
'truce',
'armistice']],
['AIRSTRIKE',
['airstrike',
'air strike',
'air raid',
'warplane',
'fighter jet']],
['MISSILE_STRIKE',
['missile',
'rocket strike',
'ballistic']],
['DRONE_STRIKE',
['drone strike',
'uav strike',
'loitering munition']],
['SHELLING',
['shelling',
'artillery',
'mortar',
'bombardment']],
['INCURSION',
['incursion',
'crossed border',
'ground invasion',
'raid across']],
['TERROR_ATTACK',
['terror attack',
'suicide bombing',
'mass shooting']],
['SABOTAGE',
['sabotage',
'pipeline blast',
'railway attack']],
['BLOCKADE',
['blockade',
'siege',
'shipping interdiction']],
['MOBILIZATION',
['mobilization',
'mobilisation',
'troop buildup',
'reinforcements',
'conscription']],
['TERRITORIAL_CHANGE',
['captured',
'seized territory',
'lost control',
'advanced into']],
['BATTLE',
['battle',
'clashes',
'fighting',
'combat',
'offensive']],
['ARREST',
['detained',
'arrested',
'captured commander']],
['PROTEST',
['protest',
'demonstration',
'riot']]
]);
export function classifyConflictEvent(event = {
}) {
  const explicit = String(event.attributes?.eventType || event.eventType || '').toUpperCase();
  if (RULES.some(([type]) => type === explicit))
  return explicit;
  const text = `${event.title || ''} ${event.attributes?.description || ''}`;
  for (const [type,
  terms] of RULES)
  if (includesAny(text,
  terms))
  return type;
  return event.category === 'terror' ? 'TERROR_ATTACK' : event.category === 'protest' ? 'PROTEST' : 'OTHER';
}
