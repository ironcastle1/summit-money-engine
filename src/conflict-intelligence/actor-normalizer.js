import {
  clean,
  slug,
  uniqueText
}
from './text.js';
const CIVILIAN_TERMS = ['civilian',
'resident',
'journalist',
'aid worker',
'hospital staff'];
export function actorFrom(value,
role = 'UNKNOWN') {
  if (!value)
  return null;
  if (typeof value === 'string')
  return Object.freeze({
    id: slug(value),
    name: clean(value,
    120),
    role,
    type: CIVILIAN_TERMS.some(term => value.toLowerCase().includes(term)) ? 'CIVILIAN' : 'ORGANIZATION'
  });
  const name = clean(value.name || value.label || value.id,
  120);
  if (!name)
  return null;
  return Object.freeze({
    id: slug(value.id || name),
    name,
    role: String(value.role || role).toUpperCase(),
    type: String(value.type || 'ORGANIZATION').toUpperCase(),
    country: clean(value.country,
    80) || null,
    aliases: uniqueText(value.aliases || [],
    100)
  });
}
export function actorsFromEvent(event = {
}) {
  const attributes = event.attributes || {
  },
  raw = [...(attributes.actors || []),
  attributes.actor1,
  attributes.actor2,
  attributes.attacker && {
    name: attributes.attacker,
    role: 'ATTACKER'
  },
  attributes.target && {
    name: attributes.target,
    role: 'TARGET'
  }].filter(Boolean);
  const actors = raw.map((value,
  index) => actorFrom(value,
  index === 0 ? 'PRIMARY' : 'SECONDARY')).filter(Boolean);
  const unique = new Map(actors.map(actor => [actor.id,
  actor]));
  return [...unique.values()];
}
