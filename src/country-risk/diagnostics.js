export function countryRiskDiagnostics(platform){
  return Object.freeze({
    service:'country-risk',version:'20.10.0',countries:platform.countryCatalog?.countries?.length||0,cachedSnapshots:platform.snapshotCache?.size||0,watchOwners:platform.watchlist?.items?.size||0,dependencies:Object.freeze({
      countryIntelligence:Boolean(platform.countryIntelligence),eventService:Boolean(platform.eventService),intelligenceSources:Boolean(platform.intelligenceRegistry)
    })
  });
}
