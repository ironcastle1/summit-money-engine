import {
  clamp, round
}
from './numbers.js';
export function tsunamiImpact(event= {
}) {
  const a=event.attributes|| {
  };
  const wave=Number(a.waveHeightMetres??a.maximumWaveMetres??0), runup=Number(a.runupMetres??0), warning=String(a.warningLevel??event.alertLevel??'').toUpperCase(), coast=Number(a.coastlineKmAffected??0);
  const warningScore= {
    ADVISORY:25, WATCH:45, WARNING:75, EMERGENCY:95
  }
  [warning]||0;
  const score=clamp(warningScore+wave*12+runup*5+Math.log10(Math.max(1, coast))*6);
  return Object.freeze( {
    score:round(score, 1), waveHeightMetres:wave||null, runupMetres:runup||null, warningLevel:warning||null, coastlineKmAffected:coast||null
  });
}
