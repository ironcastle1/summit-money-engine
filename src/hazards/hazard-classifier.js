const RULES=Object.freeze([ ['EARTHQUAKE', ['earthquake', 'seismic', 'quake']], ['TROPICAL_CYCLONE', ['hurricane', 'typhoon', 'cyclone', 'tropical storm']], ['TSUNAMI', ['tsunami']], ['FLOOD', ['flood', 'inundation', 'storm surge']], ['WILDFIRE', ['wildfire', 'forest fire', 'bushfire']], ['VOLCANO', ['volcano', 'volcanic', 'eruption']], ['EXTREME_HEAT', ['extreme heat', 'heatwave', 'heat wave']], ['WINTER_STORM', ['blizzard', 'winter storm', 'ice storm', 'heavy snow']], ['DROUGHT', ['drought', 'water scarcity']], ['LANDSLIDE', ['landslide', 'mudslide', 'debris flow']], ['SEVERE_WEATHER', ['tornado', 'hail', 'severe weather', 'thunderstorm']] ]);
export function classifyHazard(record= {
}) {
  const haystack=[record.type, record.kind, record.category, record.title, record.description, record.attributes?.eventType].filter(Boolean).join(' ').toLowerCase();
  for(const [type, terms] of RULES)if(terms.some(term=>haystack.includes(term)))return type;
  return'OTHER';
}
export function hazardTerms(type) {
  return RULES.find(([id])=>id===type)?.[1]||[];
}
