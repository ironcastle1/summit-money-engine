import {
  earthquakeImpact
}
from './earthquake-impact.js';
import {
  stormImpact
}
from './storm-impact.js';
import {
  floodImpact
}
from './flood-impact.js';
import {
  wildfireImpact
}
from './wildfire-impact.js';
import {
  volcanoImpact
}
from './volcano-impact.js';
import {
  tsunamiImpact
}
from './tsunami-impact.js';
import {
  heatImpact
}
from './heat-impact.js';
import {
  winterImpact
}
from './winter-impact.js';
import {
  droughtImpact
}
from './drought-impact.js';
import {
  landslideImpact
}
from './landslide-impact.js';
import {
  clamp, round
}
from './numbers.js';
const MODELS= {
  EARTHQUAKE:earthquakeImpact, TROPICAL_CYCLONE:stormImpact, SEVERE_WEATHER:stormImpact, FLOOD:floodImpact, WILDFIRE:wildfireImpact, VOLCANO:volcanoImpact, TSUNAMI:tsunamiImpact, EXTREME_HEAT:heatImpact, WINTER_STORM:winterImpact, DROUGHT:droughtImpact, LANDSLIDE:landslideImpact
};
export function hazardImpact(event) {
  const model=MODELS[event.type];
  const result=model?model(event): {
    score:event.severityScore||20
  };
  const score=round(clamp(Math.max(event.severityScore||0, result.score||0)), 1);
  return Object.freeze( {
    ...result, score, model:event.type
  });
}
