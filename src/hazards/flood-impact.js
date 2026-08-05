import {
  clamp, round
}
from './numbers.js';
export function floodImpact(event= {
}) {
  const a=event.attributes|| {
  };
  const depth=Number(a.depthMetres??0), area=Number(a.areaKm2??0), displaced=Number(a.displaced??0), fatalities=Number(a.fatalities??0), duration=Number(a.durationHours??0);
  const score=clamp(depth*12+Math.log10(Math.max(1, area))*8+Math.log10(Math.max(1, displaced))*9+fatalities*1.5+Math.min(15, duration/24));
  return Object.freeze( {
    score:round(score, 1), depthMetres:depth||null, areaKm2:area||null, displaced:displaced||0, fatalities:fatalities||0, durationHours:duration||null
  });
}
