import {
  haversineKm, pointOf
}
from './geo.js';
import {
  DEFAULT_RADIUS_KM
}
from './constants.js';
import {
  finite, round, clamp
}
from './numbers.js';
export function logisticsExposure(event, catalog= {
}, options= {
}) {
  const radius=finite(options.radiusKm, DEFAULT_RADIUS_KM[event.type]||120);
  const nodes=[...(catalog.ports||[]), ...(catalog.chokepoints||[])];
  const affected=[];
  for(const node of nodes) {
    const point=pointOf(node);
    if(!point)continue;
    const distanceKm=haversineKm(event.point, point);
    if(distanceKm>radius)continue;
    const importance=clamp(node.importance??node.criticality??50);
    const proximity=Math.max(0, 1-distanceKm/radius);
    const disruption=clamp(event.materiality.score*0.55+importance*proximity*0.65);
    affected.push(Object.freeze( {
      id:node.id||node.code||node.name, name:node.name||'Unknown logistics node', kind:String(node.kind||node.type||'PORT').toUpperCase(), distanceKm:round(distanceKm, 1), importance, disruptionScore:round(disruption, 1)
    }));
  }
  affected.sort((a, b)=>b.disruptionScore-a.disruptionScore);
  return Object.freeze( {
    radiusKm:radius, affected:Object.freeze(affected.slice(0, 100)), maximumDisruptionScore:affected[0]?.disruptionScore||0, count:affected.length
  });
}
