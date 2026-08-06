export function hazardDiagnostics(platform) {
  const snapshot=platform.lastSnapshot;
  return Object.freeze( {
    ready:true, lastGeneratedAt:snapshot?.generatedAt||null, lastEventCount:snapshot?.events?.length||0, lastMaterialCount:snapshot?.materialEvents?.length||0, watchlistEnabled:Boolean(platform.watchlist), sourceMode:'MERLIN_EVENT_FUSION', policies:platform.policies, generatedAt:new Date().toISOString()
  });
}
