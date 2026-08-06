import {
  HAZARD_TYPES, DEFAULT_RADIUS_KM, MATERIALITY_DEFAULTS
}
from './constants.js';
const TITLES= {
  EARTHQUAKE:'Major earthquakes', TROPICAL_CYCLONE:'Tropical cyclones', FLOOD:'Floods', WILDFIRE:'Wildfires', VOLCANO:'Volcanic activity', TSUNAMI:'Tsunami warnings', EXTREME_HEAT:'Extreme heat', WINTER_STORM:'Winter storms', DROUGHT:'Drought', LANDSLIDE:'Landslides', SEVERE_WEATHER:'Severe weather', OTHER:'Other material hazards'
};
export function hazardCatalog() {
  return Object.freeze( {
    types:Object.freeze(HAZARD_TYPES.map(type=>Object.freeze( {
      id:type, title:TITLES[type], defaultRadiusKm:DEFAULT_RADIUS_KM[type], materialOnly:type==='EARTHQUAKE', description:`Operational ${TITLES[type].toLowerCase()} intelligence and impact analysis`
    }))), materialityDefaults:MATERIALITY_DEFAULTS, generatedAt:new Date().toISOString()
  });
}
