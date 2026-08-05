export function countryRiskFeatures(profiles = []) {
  return Object.freeze({
    type:'FeatureCollection',features:Object.freeze(profiles.map(profile=>Object.freeze({
      type:'Feature',id:`country-risk:${profile.country.iso2}`,geometry:{
        type:'Point',coordinates:[Number(profile.country.lon),Number(profile.country.lat)]
      },properties:{
        kind:'COUNTRY_RISK',iso2:profile.country.iso2,name:profile.country.name,localName:profile.country.nativeName||'',riskScore:profile.risk.score,riskBand:profile.risk.band.id,confidence:profile.risk.confidence,coverage:profile.risk.coverage,interactive:true
      }
    })))
  });
}
