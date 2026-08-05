import {
  actorCapability
}
from './actor-capability.js';
export function forcePosture(actorGraph,
events = []) {
  return Object.freeze(actorGraph.nodes.map(actor => {
    const capability = actorCapability(actor,
    events),
    relevant = events.filter(event => event.actors?.some(item => item.id === actor.id)),
    mobilization = relevant.filter(event => event.type === 'MOBILIZATION').length,
    offensive = relevant.filter(event => ['INCURSION',
    'BATTLE',
    'AIRSTRIKE',
    'MISSILE_STRIKE'].includes(event.type)).length;
    return Object.freeze({
      actor,
      capability,
      mobilization,
      offensive,
      posture: mobilization > 1 || offensive > 4 ? 'OFFENSIVE' : offensive ? 'ACTIVE' : 'STATIC'
    });
  }));
}
