import {
  COUNTRY_SCENARIOS
}
from './scenario-catalog.js';
import {
  FACTOR_WEIGHTS,
  RISK_BANDS
}
from './constants.js';
export function countryRiskCatalog(){
  return Object.freeze({
    version:'20.10.0',factors:Object.freeze(Object.entries(FACTOR_WEIGHTS).map(([id,weight])=>({
      id,weight
    }))),riskBands:RISK_BANDS,scenarios:COUNTRY_SCENARIOS,capabilities:Object.freeze(['country-ranking','country-comparison','political-risk-scenarios','sanctions-network','election-calendar','watchlists','alerts','map-features','briefings','exports']),sourcePolicy:'Measured live evidence is preferred. Static metadata, inferred values and unavailable inputs are labelled explicitly.'
  });
}
