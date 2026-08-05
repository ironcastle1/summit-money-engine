import {
  clamp, round
}
from './numbers.js';
export function landslideImpact(event= {
}) {
  const a=event.attributes|| {
  };
  const volume=Number(a.volumeM3??0), fatalities=Number(a.fatalities??0), roads=Number(a.roadsBlocked??0), rain=Number(a.rainfallMm24h??0), structures=Number(a.structuresAffected??0);
  const score=clamp(Math.log10(Math.max(1, volume))*10+fatalities*2+roads*5+rain*0.08+structures*1.5);
  return Object.freeze( {
    score:round(score, 1), volumeM3:volume||null, fatalities:fatalities||0, roadsBlocked:roads||0, rainfallMm24h:rain||null, structuresAffected:structures||0
  });
}
