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
const WEIGHTS= {
  PORT:1.3, AIRPORT:1.2, POWER:1.4, PIPELINE:1.25, RAIL:1.05, ROAD:0.9, HOSPITAL:1.5, DATACENTRE:1.35, INDUSTRIAL:1.15, OTHER:1
};
export function infrastructureExposure(event, assets=[], options= {
}) {
  const radius=finite(options.radiusKm, DEFAULT_RADIUS_KM[event.type]||120);
  const records=[];
  let aggregate=0;
  for(const asset of assets) {
    const point=pointOf(asset);
    if(!point)continue;
    const distanceKm=haversineKm(event.point, point);
    if(distanceKm>radius)continue;
    const type=String(asset.type||asset.kind||'OTHER').toUpperCase();
    const criticality=clamp(asset.criticality??asset.importance??50);
    const proximity=Math.max(0, 1-distanceKm/radius);
    const score=clamp(criticality*proximity*(WEIGHTS[type]||1));
    aggregate+=score;
    records.push(Object.freeze( {
      id:asset.id||asset.code||asset.name, name:asset.name||asset.title||'Unnamed asset', type, distanceKm:round(distanceKm, 1), criticality, exposureScore:round(score, 1)
    }));
  }
  records.sort((a, b)=>b.exposureScore-a.exposureScore);
  return Object.freeze( {
    radiusKm:radius, aggregateScore:round(Math.min(100, aggregate/Math.max(1, Math.sqrt(records.length))), 1), assets:Object.freeze(records.slice(0, 250)), count:records.length
  });
}
