import {
  haversineKm, pointOf
}
from './geo.js';
import {
  DEFAULT_RADIUS_KM
}
from './constants.js';
import {
  finite, round
}
from './numbers.js';
export function populationExposure(event, places=[], options= {
}) {
  const radius=finite(options.radiusKm, DEFAULT_RADIUS_KM[event.type]||120);
  const affected=[];
  let population=0;
  for(const place of places) {
    const point=pointOf(place);
    if(!point)continue;
    const distanceKm=haversineKm(event.point, point);
    if(distanceKm>radius)continue;
    const pop=Math.max(0, finite(place.population??place.attributes?.population));
    const attenuation=Math.max(0, 1-distanceKm/radius);
    const exposed=Math.round(pop*attenuation);
    if(exposed<=0)continue;
    population+=exposed;
    affected.push(Object.freeze( {
      id:place.id||place.code||place.name, name:place.name||place.title||'Unknown', distanceKm:round(distanceKm, 1), population:pop, estimatedExposed:exposed, attenuation:round(attenuation, 3)
    }));
  }
  affected.sort((a, b)=>b.estimatedExposed-a.estimatedExposed);
  return Object.freeze( {
    radiusKm:radius, estimatedPopulation:population, places:Object.freeze(affected.slice(0, 100)), method:'DISTANCE_ATTENUATED_CATALOGUE_ESTIMATE'
  });
}
