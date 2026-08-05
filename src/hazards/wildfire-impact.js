import {
  clamp, round
}
from './numbers.js';
export function wildfireImpact(event= {
}) {
  const a=event.attributes|| {
  };
  const area=Number(a.areaHectares??a.burnedAreaHectares??0), containment=Number(a.containmentPercent??0), structures=Number(a.structuresThreatened??0), wind=Number(a.windKph??0), evacuated=Number(a.evacuated??0);
  const score=clamp(Math.log10(Math.max(1, area))*14+(100-containment)*0.2+Math.log10(Math.max(1, structures))*8+wind*0.12+Math.log10(Math.max(1, evacuated))*6);
  return Object.freeze( {
    score:round(score, 1), areaHectares:area||null, containmentPercent:containment||0, structuresThreatened:structures||0, windKph:wind||null, evacuated:evacuated||0
  });
}
