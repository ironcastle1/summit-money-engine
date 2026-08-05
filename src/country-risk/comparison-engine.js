export function compareCountries(profiles = []) {
  const metrics=['score',
  'confidence',
  'coverage'];
  const rows=profiles.map(profile=>Object.freeze({
    iso2:profile.country.iso2,name:profile.country.name,score:profile.risk.score,band:profile.risk.band.id,confidence:profile.risk.confidence,coverage:profile.risk.coverage,topDrivers:Object.freeze((profile.risk.components||[]).sort((a,b)=>b.score*b.weight-a.score*a.weight).slice(0,5).map(item=>item.id))
  }));
  const leaders=Object.fromEntries(metrics.map(metric=>[metric,rows.slice().sort((a,b)=>b[metric]-a[metric])[0]||null]));
  return Object.freeze({
    countries:Object.freeze(rows),leaders:Object.freeze(leaders),generatedAt:new Date().toISOString()
  });
}
