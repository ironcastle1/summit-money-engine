import {
  MATERIALITY_DEFAULTS
}
from './constants.js';
import {
  hazardImpact
}
from './hazard-impact.js';
import {
  ageHours
}
from './time.js';
import {
  clamp, round
}
from './numbers.js';
function truthy(v) {
  return v===true||String(v).toLowerCase()==='true';
}
export function evaluateMateriality(event, policy= {
}) {
  const cfg= {
    ...MATERIALITY_DEFAULTS, ...policy
  };
  const impact=hazardImpact(event);
  const reasons=[];
  const a=event.attributes|| {
  };
  if(truthy(a.material)||truthy(event.raw?.material))reasons.push('EXPLICIT_MATERIAL');
  if(Number(a.fatalities)>0)reasons.push('FATALITIES');
  if(Number(a.displaced)>=1000)reasons.push('MASS_DISPLACEMENT');
  if(truthy(a.infrastructureImpact))reasons.push('INFRASTRUCTURE_IMPACT');
  if(truthy(a.shippingImpact)||truthy(a.portClosure))reasons.push('SHIPPING_IMPACT');
  if(truthy(a.sovereignImpact))reasons.push('SOVEREIGN_IMPACT');
  if(event.type==='EARTHQUAKE') {
    if(Number(event.magnitude)>=cfg.earthquakeMagnitude)reasons.push('MAGNITUDE_THRESHOLD');
    if(Number(a.significance)>=cfg.earthquakeSignificance)reasons.push('SIGNIFICANCE_THRESHOLD');
    if(truthy(a.tsunami))reasons.push('TSUNAMI_TRIGGER');
  }
  if(event.type==='TROPICAL_CYCLONE'&&Number(a.windKph??a.maximumWindKph)>=cfg.tropicalWindKph)reasons.push('DESTRUCTIVE_WIND');
  if(event.type==='WILDFIRE'&&Number(a.areaHectares??a.burnedAreaHectares)>=cfg.wildfireAreaHectares)reasons.push('LARGE_FIRE');
  if(event.type==='FLOOD'&&Number(a.displaced)>=cfg.floodDisplaced)reasons.push('LARGE_DISPLACEMENT');
  if(event.type==='VOLCANO'&&cfg.volcanoAlertLevels.includes(String(a.aviationColourCode??a.aviationColorCode??event.alertLevel).toUpperCase()))reasons.push('AVIATION_ALERT');
  if(event.type==='TSUNAMI'&&Number(a.waveHeightMetres??a.maximumWaveMetres)>=cfg.tsunamiWaveMetres)reasons.push('WAVE_THRESHOLD');
  if(impact.score>=cfg.minimumScore)reasons.push('IMPACT_SCORE');
  const age=ageHours(event.time);
  const current=age<=cfg.maximumAgeHours;
  const score=round(clamp(impact.score+(reasons.length?Math.min(18, reasons.length*3):0)), 1);
  return Object.freeze( {
    material:current&&reasons.length>0, current, score, reasons:Object.freeze(reasons), ageHours:round(age, 1), impact
  });
}
export function retainMaterialHazard(event, policy) {
  return evaluateMateriality(event, policy).material;
}
