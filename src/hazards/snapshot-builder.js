import {
  normalizeHazardEvents
}
from './event-normalizer.js';
import {
  evaluateMateriality
}
from './materiality-policy.js';
import {
  hazardConfidence
}
from './confidence-score.js';
import {
  inBounds
}
from './geo.js';
import {
  withinHours
}
from './time.js';
import {
  clusterHazards
}
from './event-cluster.js';
import {
  hazardTimeline
}
from './timeline.js';
export function buildHazardSnapshot(sourceSnapshot= {
}, options= {
}) {
  const maximumAgeHours=Number(options.maximumAgeHours||336);
  let events=normalizeHazardEvents(sourceSnapshot.events||[]).map(event=>Object.freeze( {
    ...event, confidence:hazardConfidence(event, sourceSnapshot.sources||[]), materiality:evaluateMateriality(event, options.policy)
  })).filter(event=>withinHours(event.time, maximumAgeHours)).filter(event=>inBounds(event.point, options.bounds)).filter(event=>!options.types?.length||options.types.includes(event.type));
  const materialEvents=events.filter(event=>event.materiality.material);
  if(options.materialOnly!==false)events=materialEvents;
  events.sort((a, b)=>(b.materiality?.score||0)-(a.materiality?.score||0)||Date.parse(b.time)-Date.parse(a.time));
  const limit=Math.max(1, Math.min(5000, Number(options.limit||1000)));
  events=events.slice(0, limit);
  return Object.freeze( {
    events:Object.freeze(events), materialEvents:Object.freeze(materialEvents.slice(0, limit)), clusters:clusterHazards(events, options.cluster), timeline:hazardTimeline(events), sourceStatus:sourceSnapshot.sources||[], generatedAt:sourceSnapshot.generatedAt||new Date().toISOString(), filteredCount:events.length, totalNormalized:normalizeHazardEvents(sourceSnapshot.events||[]).length
  });
}
