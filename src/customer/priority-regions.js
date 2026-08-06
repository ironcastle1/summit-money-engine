const REGION_DEFINITIONS = Object.freeze([
  Object.freeze({
    id: 'middle-east',
    label: 'Middle East',
    shortLabel: 'Middle East',
    centre: Object.freeze({ lat: 29, lon: 44 }),
    zoom: 4,
    countryCodes: Object.freeze(['AE','BH','CY','EG','IL','IQ','IR','JO','KW','LB','OM','PS','QA','SA','SY','TR','YE']),
    queryTerms: Object.freeze(['Middle East','Iran','Israel','Gaza','Palestine','Saudi Arabia','United Arab Emirates','UAE','Turkey','Syria','Iraq','Jordan','Lebanon','Yemen','Qatar','Oman','Kuwait','Bahrain','Red Sea','Persian Gulf','Strait of Hormuz']),
    industries: Object.freeze(['energy','shipping','aviation','construction','defence','food imports','tourism','financial services']),
    watchTopics: Object.freeze(['Red Sea shipping','Gulf energy exports','sanctions and trade access','airspace and aviation','reconstruction demand','food and water security']),
    corridors: Object.freeze(['Suez and Red Sea','Strait of Hormuz','Eastern Mediterranean','Gulf–Asia trade']),
    description: 'Energy, shipping, sanctions, conflict spillover, airspace and reconstruction demand.'
  }),
  Object.freeze({
    id: 'europe',
    label: 'Europe',
    shortLabel: 'Europe',
    centre: Object.freeze({ lat: 51, lon: 13 }),
    zoom: 4,
    countryCodes: Object.freeze([]),
    queryTerms: Object.freeze(['Europe','European Union','EU','United Kingdom','Britain','France','Germany','Italy','Spain','Poland','Ukraine','NATO','Balkans','Baltic','Black Sea','Brussels']),
    industries: Object.freeze(['manufacturing','energy','financial services','defence','logistics','agriculture','technology','tourism']),
    watchTopics: Object.freeze(['Ukraine and European security','energy and power costs','EU regulation','industrial competitiveness','elections and fiscal policy','Baltic and Black Sea logistics']),
    corridors: Object.freeze(['North Sea gateways','Baltic routes','Rhine–Danube','Mediterranean–Suez']),
    description: 'Industrial demand, regulation, energy, elections, security and cross-border trade.'
  }),
  Object.freeze({
    id: 'russia',
    label: 'Russia',
    shortLabel: 'Russia',
    centre: Object.freeze({ lat: 57, lon: 55 }),
    zoom: 3,
    countryCodes: Object.freeze(['RU']),
    queryTerms: Object.freeze(['Russia','Russian','Moscow','Kremlin','Siberia','Black Sea Fleet','Russian oil','Russian gas']),
    industries: Object.freeze(['energy','metals','agriculture','defence','shipping','rail freight','financial compliance']),
    watchTopics: Object.freeze(['sanctions enforcement','energy export routes','war economy','Black Sea access','Arctic logistics','currency and capital controls']),
    corridors: Object.freeze(['Baltic export routes','Black Sea routes','Northern Sea Route','China–Russia rail']),
    description: 'Sanctions, energy, war economy, transport corridors and commodity exports.'
  }),
  Object.freeze({
    id: 'major-asia',
    label: 'Major Asia',
    shortLabel: 'Asia',
    centre: Object.freeze({ lat: 31, lon: 104 }),
    zoom: 3,
    countryCodes: Object.freeze(['BD','CN','HK','ID','IN','JP','KR','KP','KZ','MY','PK','PH','SG','TH','TW','VN']),
    queryTerms: Object.freeze(['China','Chinese','India','Indian','Japan','Japanese','South Korea','North Korea','Taiwan','Indonesia','Singapore','Vietnam','Thailand','Malaysia','Philippines','Pakistan','Bangladesh','Kazakhstan','South China Sea','Taiwan Strait']),
    industries: Object.freeze(['semiconductors','electronics','manufacturing','shipping','energy','automotive','commodities','digital services']),
    watchTopics: Object.freeze(['China demand and policy','Taiwan Strait risk','semiconductor supply','South China Sea','Asian manufacturing orders','currency and export controls']),
    corridors: Object.freeze(['Asia–Europe shipping','Trans-Pacific','Malacca Strait','South China Sea','Gulf–Asia energy']),
    description: 'Manufacturing, technology, trade routes, energy demand and regional security.'
  }),
  Object.freeze({
    id: 'north-africa',
    label: 'North Africa',
    shortLabel: 'North Africa',
    centre: Object.freeze({ lat: 29, lon: 13 }),
    zoom: 4,
    countryCodes: Object.freeze(['DZ','EG','LY','MA','SD','TN']),
    queryTerms: Object.freeze(['North Africa','Egypt','Morocco','Algeria','Tunisia','Libya','Sudan','Suez Canal','Mediterranean migration']),
    industries: Object.freeze(['energy','fertiliser','agriculture','tourism','construction','shipping','textiles','renewables']),
    watchTopics: Object.freeze(['Suez Canal traffic','Mediterranean energy','food import pressure','North African manufacturing','tourism demand','Sudan and Libya security']),
    corridors: Object.freeze(['Suez Canal','Western Mediterranean','Central Mediterranean','North Africa–Europe trade']),
    description: 'Suez, energy, food imports, manufacturing, migration and European trade links.'
  }),
  Object.freeze({
    id: 'united-states',
    label: 'United States',
    shortLabel: 'United States',
    centre: Object.freeze({ lat: 39, lon: -98 }),
    zoom: 3,
    countryCodes: Object.freeze(['US']),
    queryTerms: Object.freeze(['United States','US economy','U.S. economy','Washington','Federal Reserve','White House','Congress','US tariffs','American business','Wall Street']),
    industries: Object.freeze(['technology','finance','energy','defence','agriculture','consumer markets','logistics','healthcare']),
    watchTopics: Object.freeze(['Federal Reserve and inflation','tariffs and trade policy','technology regulation','energy production','defence procurement','consumer demand']),
    corridors: Object.freeze(['Trans-Pacific','North Atlantic','US–Mexico trade','US–Canada trade']),
    description: 'Markets, monetary policy, tariffs, technology, energy and global demand.'
  })
]);

const MAJOR_ASIA = new Set(REGION_DEFINITIONS.find(region => region.id === 'major-asia').countryCodes);
const MIDDLE_EAST = new Set(REGION_DEFINITIONS.find(region => region.id === 'middle-east').countryCodes);
const NORTH_AFRICA = new Set(REGION_DEFINITIONS.find(region => region.id === 'north-africa').countryCodes);
const UNITED_STATES = new Set(['US']);
const RUSSIA = new Set(['RU']);

function clean(value) {
  return String(value || '').trim();
}

function regionMatchesCountry(region, country) {
  const code = clean(country?.iso2 || country?.countryCode).toUpperCase();
  if (!code) return false;
  if (region.id === 'europe') return country?.region === 'Europe' && code !== 'RU';
  return region.countryCodes.includes(code);
}

export function priorityRegionCatalog(countries = []) {
  return REGION_DEFINITIONS.map(region => {
    const codes = region.id === 'europe'
      ? countries.filter(country => regionMatchesCountry(region, country)).map(country => country.iso2)
      : [...region.countryCodes];
    return Object.freeze({ ...region, countryCodes: Object.freeze(codes) });
  });
}

export function focusRegionIdsForCountry(country, catalog = REGION_DEFINITIONS) {
  const code = clean(country?.iso2 || country?.countryCode).toUpperCase();
  const result = [];
  if (!code) return result;
  if (MIDDLE_EAST.has(code)) result.push('middle-east');
  if ((country?.region === 'Europe' && code !== 'RU') || ['TR','CY'].includes(code)) result.push('europe');
  if (RUSSIA.has(code)) result.push('russia');
  if (MAJOR_ASIA.has(code)) result.push('major-asia');
  if (NORTH_AFRICA.has(code)) result.push('north-africa');
  if (UNITED_STATES.has(code)) result.push('united-states');
  return [...new Set(result)].filter(id => catalog.some(region => region.id === id));
}

export function focusRegionIdsForText(text, catalog = REGION_DEFINITIONS) {
  const haystack = ` ${clean(text).toLowerCase()} `;
  if (!haystack.trim()) return [];
  const matches = [];
  for (const region of catalog) {
    if (region.queryTerms.some(term => haystack.includes(term.toLowerCase()))) matches.push(region.id);
  }
  return matches;
}

export function focusRegionIdsForArticle(article, location, countryIndex, catalog) {
  const country = location?.countryCode ? countryIndex.get(String(location.countryCode).toUpperCase()) : null;
  const byCountry = focusRegionIdsForCountry(country || location, catalog);
  const byText = focusRegionIdsForText(`${article?.title || ''} ${article?.summary || ''}`, catalog);
  return [...new Set([...byCountry, ...byText])];
}

export function isPriorityCountry(country, catalog = REGION_DEFINITIONS) {
  return focusRegionIdsForCountry(country, catalog).length > 0;
}

export function regionalGdeltQueries(catalog = REGION_DEFINITIONS) {
  const topic = '(conflict OR attack OR shipping OR sanctions OR strike OR closure OR outage OR election OR protest OR cyber OR commodity OR trade OR tariff OR energy OR port)';
  return catalog.map(region => ({
    id: `gdelt-${region.id}`,
    name: `GDELT ${region.label}`,
    regionId: region.id,
    query: `${topic} (${region.queryTerms.map(term => `\"${term}\"`).join(' OR ')})`
  }));
}

export function buildStrategicWatchAreas(catalog = REGION_DEFINITIONS) {
  const watchAreas = [
    { id: 'red-sea', regionId: 'middle-east', title: 'Red Sea and Bab el-Mandeb', lat: 13.5, lon: 43.3, type: 'shipping', why: 'Connects Asia–Europe shipping through Suez; disruption affects freight time, insurance and capacity.', sectors: ['shipping','energy','retail','manufacturing'] },
    { id: 'hormuz', regionId: 'middle-east', title: 'Strait of Hormuz', lat: 26.5, lon: 56.3, type: 'energy', why: 'Critical Gulf oil and LNG export route with direct implications for energy prices and shipping risk.', sectors: ['oil','gas','shipping','chemicals'] },
    { id: 'eastern-mediterranean', regionId: 'middle-east', title: 'Eastern Mediterranean', lat: 34.5, lon: 33.5, type: 'security', why: 'Conflict, offshore energy and airspace changes can affect Europe–Middle East trade and tourism.', sectors: ['energy','aviation','tourism','shipping'] },
    { id: 'ukraine-black-sea', regionId: 'europe', title: 'Ukraine and Black Sea', lat: 46.2, lon: 33.8, type: 'security', why: 'Security conditions affect grain exports, energy infrastructure, insurance and European defence demand.', sectors: ['agriculture','energy','defence','shipping'] },
    { id: 'rhine-industrial', regionId: 'europe', title: 'Rhine–North Sea industrial corridor', lat: 50.5, lon: 6.5, type: 'industry', why: 'A dense manufacturing and logistics corridor exposed to energy prices, river levels and European demand.', sectors: ['manufacturing','chemicals','logistics','energy'] },
    { id: 'baltic', regionId: 'europe', title: 'Baltic and North Sea', lat: 56, lon: 15, type: 'shipping', why: 'Energy links, ports and security conditions affect Northern European trade and Russian export routes.', sectors: ['energy','shipping','defence','telecoms'] },
    { id: 'russian-energy-west', regionId: 'russia', title: 'Western Russian export network', lat: 56, lon: 40, type: 'energy', why: 'Sanctions, infrastructure and pricing policy shape oil, gas, metals and fertiliser availability.', sectors: ['oil','gas','metals','fertiliser'] },
    { id: 'arctic-route', regionId: 'russia', title: 'Northern Sea Route', lat: 72, lon: 95, type: 'shipping', why: 'Arctic access and infrastructure determine a developing Russia–Asia shipping and resource corridor.', sectors: ['shipping','lng','mining','insurance'] },
    { id: 'taiwan-strait', regionId: 'major-asia', title: 'Taiwan Strait', lat: 24.5, lon: 119.5, type: 'technology', why: 'Security and shipping conditions can affect semiconductor supply and major Asia–US trade lanes.', sectors: ['semiconductors','electronics','shipping','defence'] },
    { id: 'malacca', regionId: 'major-asia', title: 'Strait of Malacca', lat: 2.7, lon: 101.5, type: 'shipping', why: 'A central Asia trade and energy chokepoint linking the Indian and Pacific oceans.', sectors: ['shipping','oil','lng','manufacturing'] },
    { id: 'china-industry', regionId: 'major-asia', title: 'Coastal China manufacturing belt', lat: 30.5, lon: 120.5, type: 'industry', why: 'Orders, policy and port throughput influence global electronics, machinery and consumer-goods supply.', sectors: ['electronics','machinery','retail','shipping'] },
    { id: 'suez', regionId: 'north-africa', title: 'Suez Canal', lat: 30.4, lon: 32.4, type: 'shipping', why: 'The principal Europe–Asia shortcut; disruption changes voyage times, capacity and delivered cost.', sectors: ['shipping','retail','energy','manufacturing'] },
    { id: 'maghreb-europe', regionId: 'north-africa', title: 'Maghreb–Europe production corridor', lat: 35, lon: -3, type: 'industry', why: 'Nearshore manufacturing, energy and agriculture link Morocco, Algeria and Tunisia with European demand.', sectors: ['automotive','textiles','energy','agriculture'] },
    { id: 'us-gulf', regionId: 'united-states', title: 'US Gulf Coast', lat: 29.2, lon: -91.5, type: 'energy', why: 'Oil, LNG, petrochemicals and ports make this corridor globally important for energy and industrial supply.', sectors: ['oil','lng','chemicals','shipping'] },
    { id: 'us-tech', regionId: 'united-states', title: 'US technology and capital markets', lat: 37.5, lon: -121.8, type: 'technology', why: 'Technology investment, export controls and capital-market conditions transmit globally.', sectors: ['technology','finance','semiconductors','software'] }
  ];
  const validRegions = new Set(catalog.map(region => region.id));
  return watchAreas.filter(area => validRegions.has(area.regionId));
}

export function regionSummary(region, articles, opportunities, countries, ports, routes) {
  const regionArticles = articles.filter(article => article.focusRegionIds?.includes(region.id));
  const regionOpportunities = opportunities.filter(item => item.focusRegionIds?.includes(region.id));
  const regionCountries = countries.filter(country => focusRegionIdsForCountry(country, [region]).includes(region.id));
  const codeSet = new Set(regionCountries.map(country => country.iso2));
  const regionPorts = ports.filter(port => codeSet.has(port.countryCode));
  const routeIds = new Set(regionPorts.flatMap(port => port.routeIds || []));
  const regionRoutes = routes.filter(route => routeIds.has(route.properties?.id || route.id));
  const newestAt = regionArticles.map(article => article.publishedAt).sort().at(-1) || null;
  return Object.freeze({
    id: region.id,
    label: region.label,
    shortLabel: region.shortLabel,
    centre: region.centre,
    zoom: region.zoom,
    description: region.description,
    industries: region.industries,
    watchTopics: region.watchTopics,
    corridors: region.corridors,
    countryCodes: regionCountries.map(country => country.iso2),
    counts: Object.freeze({
      current: regionArticles.length,
      conflict: regionArticles.filter(article => article.category === 'conflict').length,
      disruption: regionArticles.filter(article => article.category === 'disruption').length,
      opportunities: regionOpportunities.length,
      countries: regionCountries.length,
      ports: regionPorts.length,
      routes: regionRoutes.length
    }),
    newestAt,
    topArticleIds: regionArticles.slice(0, 8).map(article => article.id),
    topOpportunityIds: regionOpportunities.slice(0, 6).map(item => item.id)
  });
}
