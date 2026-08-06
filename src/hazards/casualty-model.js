import {
  clamp, round, finite
}
from './numbers.js';
const VULNERABILITY= {
  LOW:0.35, MEDIUM:0.65, HIGH:1, VERY_HIGH:1.4
};
export function casualtyEstimate(event, populationExposure= {
}, options= {
}) {
  const population=finite(populationExposure.estimatedPopulation);
  const severity=clamp(event.materiality?.score??event.severityScore);
  const vulnerability=VULNERABILITY[String(options.vulnerability||'MEDIUM').toUpperCase()]||0.65;
  const preparedness=clamp(options.preparedness??50)/100;
  const rate=(severity/100)**3*0.0025*vulnerability*(1-preparedness*0.65);
  const midpoint=population*rate;
  return Object.freeze( {
    estimatedAffected:Math.round(population*Math.min(0.75, (severity/100)*0.45)), fatalityRange:Object.freeze( {
      low:Math.floor(midpoint*0.25), high:Math.ceil(midpoint*2.2)
    }), injuryRange:Object.freeze( {
      low:Math.floor(midpoint*3), high:Math.ceil(midpoint*15)
    }), modelScore:round(clamp(severity*vulnerability*(1-preparedness*0.5)), 1), method:'SCENARIO_ESTIMATE_NOT_OBSERVED'
  });
}
