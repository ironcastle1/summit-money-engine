import {
  clamp, round
}
from './numbers.js';
const CHAINS= {
  EARTHQUAKE:['LANDSLIDE', 'TSUNAMI', 'POWER_OUTAGE', 'PORT_CLOSURE'], TROPICAL_CYCLONE:['FLOOD', 'POWER_OUTAGE', 'PORT_CLOSURE', 'CROP_DAMAGE'], FLOOD:['LANDSLIDE', 'DISEASE', 'TRANSPORT_CLOSURE', 'FOOD_DISRUPTION'], WILDFIRE:['POWER_OUTAGE', 'AIR_QUALITY', 'TRANSPORT_CLOSURE'], VOLCANO:['AVIATION_CLOSURE', 'LAHAR', 'AIR_QUALITY'], EXTREME_HEAT:['POWER_STRESS', 'HEALTH_SURGE', 'WATER_STRESS'], DROUGHT:['CROP_DAMAGE', 'FOOD_INFLATION', 'MIGRATION']
};
export function cascadingRisks(event, exposure= {
}) {
  const base=event.materiality?.score||event.severityScore||0;
  const infra=exposure.infrastructure?.aggregateScore||0;
  const logistics=exposure.logistics?.maximumDisruptionScore||0;
  return Object.freeze((CHAINS[event.type]||[]).map((type, index)=>Object.freeze( {
    type, probability:round(clamp(base*0.55+infra*0.2+logistics*0.2-index*8), 1), impact:round(clamp(base*0.65+Math.max(infra, logistics)*0.35-index*4), 1)
  })).filter(x=>x.probability>=20));
}
