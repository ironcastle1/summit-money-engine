export function buildCountryBriefing(profile) {
  const drivers=(profile.risk.components||[]).filter(item=>item.state!=='UNAVAILABLE').sort((a,b)=>b.score*b.weight-a.score*a.weight).slice(0,5);
  const changes=(profile.timeline||[]).slice(0,5);
  return Object.freeze({
    title:`${profile.country.name} political-risk brief`,assessment:`${profile.country.name} is rated ${profile.risk.band.label.toLowerCase()} risk at ${profile.risk.score}/100 with ${profile.risk.confidence}% confidence.`,drivers:Object.freeze(drivers.map(item=>`${item.id}: ${item.score}/100 (${item.direction.toLowerCase()})`)),recentDevelopments:Object.freeze(changes.map(item=>item.title)),caveat:profile.risk.disclosure,generatedAt:new Date().toISOString()
  });
}
