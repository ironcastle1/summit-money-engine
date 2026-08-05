import {
  clamp, round
}
from './numbers.js';
const COLOUR= {
  GREEN:10, YELLOW:30, ORANGE:65, RED:90
};
export function volcanoImpact(event= {
}) {
  const a=event.attributes|| {
  };
  const aviation=String(a.aviationColourCode??a.aviationColorCode??event.alertLevel??'').toUpperCase();
  const vei=Number(a.vei??0), ash=Number(a.ashCloudHeightKm??0), evacuated=Number(a.evacuated??0);
  const score=clamp((COLOUR[aviation]||event.severityScore||20)+vei*7+ash*1.5+Math.log10(Math.max(1, evacuated))*5);
  return Object.freeze( {
    score:round(score, 1), aviationColourCode:aviation||null, vei:vei||null, ashCloudHeightKm:ash||null, evacuated:evacuated||0
  });
}
