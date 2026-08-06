import {
  clamp, round
}
from './numbers.js';
export function heatImpact(event= {
}) {
  const a=event.attributes|| {
  };
  const temperature=Number(a.temperatureC??a.maximumTemperatureC??0), wetBulb=Number(a.wetBulbC??0), duration=Number(a.durationHours??0), population=Number(a.populationExposed??0);
  const score=clamp(Math.max(0, temperature-32)*4+Math.max(0, wetBulb-25)*6+Math.min(20, duration/12)+Math.log10(Math.max(1, population))*4);
  return Object.freeze( {
    score:round(score, 1), temperatureC:temperature||null, wetBulbC:wetBulb||null, durationHours:duration||null, populationExposed:population||0
  });
}
