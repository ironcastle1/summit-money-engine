import {
  clamp, round
}
from './numbers.js';
export function winterImpact(event= {
}) {
  const a=event.attributes|| {
  };
  const snow=Number(a.snowfallCm??0), ice=Number(a.iceAccretionMm??0), wind=Number(a.windKph??0), temperature=Number(a.minimumTemperatureC??0), closures=Number(a.transportClosures??0);
  const score=clamp(snow*0.8+ice*1.8+wind*0.18+Math.max(0, -temperature)*1.2+closures*4);
  return Object.freeze( {
    score:round(score, 1), snowfallCm:snow||null, iceAccretionMm:ice||null, windKph:wind||null, minimumTemperatureC:Number.isFinite(temperature)?temperature:null, transportClosures:closures||0
  });
}
