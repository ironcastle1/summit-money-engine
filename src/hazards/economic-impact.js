import {
  clamp, round, finite
}
from './numbers.js';
const MULTIPLIERS= {
  EARTHQUAKE:1.25, TROPICAL_CYCLONE:1.15, FLOOD:1, WILDFIRE:0.8, VOLCANO:0.9, TSUNAMI:1.35, EXTREME_HEAT:0.55, WINTER_STORM:0.45, DROUGHT:0.75, LANDSLIDE:0.35, SEVERE_WEATHER:0.4, OTHER:0.3
};
export function economicImpact(event, exposure= {
}, options= {
}) {
  const material=event.materiality?.score||event.severityScore||0;
  const population=finite(exposure.population?.estimatedPopulation);
  const infra=finite(exposure.infrastructure?.aggregateScore);
  const logistics=finite(exposure.logistics?.maximumDisruptionScore);
  const gdpPerCapita=finite(options.gdpPerCapitaUsd, 15_000);
  const direct=Math.max(0, (population*gdpPerCapita)*(material/100)*0.015*(MULTIPLIERS[event.type]||0.5));
  const infrastructure=direct*(infra/100)*0.8;
  const supplyChain=direct*(logistics/100)*0.55;
  const total=direct+infrastructure+supplyChain;
  return Object.freeze( {
    estimatedDirectUsd:round(direct, 0), estimatedInfrastructureUsd:round(infrastructure, 0), estimatedSupplyChainUsd:round(supplyChain, 0), estimatedTotalUsd:round(total, 0), impactScore:round(clamp(Math.log10(Math.max(1, total))*7), 1), method:'MODELLED_EXPOSURE_RANGE', confidence:'LOW_TO_MODERATE'
  });
}
