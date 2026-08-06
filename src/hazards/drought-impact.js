import {
  clamp, round
}
from './numbers.js';
export function droughtImpact(event= {
}) {
  const a=event.attributes|| {
  };
  const spi=Number(a.standardPrecipitationIndex??0), area=Number(a.areaKm2??0), population=Number(a.populationExposed??0), crop=Number(a.cropLossPercent??0), reservoir=Number(a.reservoirPercent??100);
  const score=clamp(Math.max(0, -spi)*20+Math.log10(Math.max(1, area))*6+Math.log10(Math.max(1, population))*4+crop*0.35+Math.max(0, 50-reservoir)*0.5);
  return Object.freeze( {
    score:round(score, 1), standardPrecipitationIndex:spi||null, areaKm2:area||null, populationExposed:population||0, cropLossPercent:crop||0, reservoirPercent:reservoir
  });
}
