export function buildCountryTimeline(input = {
}) {
  const events=[...(input.events||[]),
  ...(input.policyEvents||[]),
  ...(input.elections||[])].map((item,index)=>Object.freeze({
    id:item.id||`timeline-${index}`,time:item.time||item.date||item.updatedAt||null,type:item.type||item.category||'EVENT',title:item.title||item.name||'Country event',severity:Number(item.severity||item.score||0),source:item.source||item.sourceId||null
  })).filter(item=>item.time).sort((a,b)=>new Date(b.time)-new Date(a.time));
  return Object.freeze(events.slice(0,Number(input.limit)||250));
}
