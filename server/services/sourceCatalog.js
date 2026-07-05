const SOURCES = [
  {
    id: 'binance',
    name: 'Binance public market API',
    category: 'crypto',
    update: 'on refresh',
    provides: ['last price', '24h change', 'recent candles'],
    missingMeans: 'Crypto price/chart unavailable; show N/A.',
    url: 'https://api.binance.com'
  },
  {
    id: 'coingecko',
    name: 'CoinGecko public API',
    category: 'crypto',
    update: 'fallback on refresh',
    provides: ['crypto prices', '24h change', 'hourly market chart fallback'],
    missingMeans: 'Crypto price/chart unavailable; show N/A.',
    url: 'https://api.coingecko.com'
  },
  {
    id: 'yahoo-chart',
    name: 'Yahoo Finance chart endpoint',
    category: 'markets',
    update: 'on refresh',
    provides: ['delayed equities', 'commodity futures', 'ETFs', 'recent candles'],
    missingMeans: 'Market price/chart unavailable; show N/A.',
    url: 'https://query1.finance.yahoo.com'
  },
  {
    id: 'world-bank',
    name: 'World Bank Indicators API',
    category: 'country',
    update: 'cached daily',
    provides: ['homicide rate', 'GDP/person', 'growth', 'inflation', 'unemployment', 'trade/GDP', 'population'],
    missingMeans: 'Country indicator unavailable; show N/A.',
    url: 'https://api.worldbank.org'
  },
  {
    id: 'police-uk',
    name: 'data.police.uk street-level crime API',
    category: 'crime',
    update: 'latest published month',
    provides: ['UK local crime counts by category near clicked point'],
    missingMeans: 'Official local crime unavailable; use N/A or national homicide indicator.',
    url: 'https://data.police.uk'
  },
  {
    id: 'gdelt',
    name: 'GDELT Doc API',
    category: 'events',
    update: 'on refresh',
    provides: ['source-linked live news/event articles'],
    missingMeans: 'No GDELT event rows loaded.',
    url: 'https://api.gdeltproject.org'
  },
  {
    id: 'reliefweb',
    name: 'ReliefWeb API',
    category: 'events',
    update: 'on refresh',
    provides: ['humanitarian and disaster reports'],
    missingMeans: 'No ReliefWeb disaster rows loaded.',
    url: 'https://api.reliefweb.int'
  },
  {
    id: 'usgs',
    name: 'USGS earthquake GeoJSON feed',
    category: 'events',
    update: 'on refresh',
    provides: ['recent M4.5+ earthquakes'],
    missingMeans: 'No earthquake rows loaded.',
    url: 'https://earthquake.usgs.gov'
  },
  {
    id: 'ucdp',
    name: 'UCDP GED API',
    category: 'conflict',
    update: 'on refresh when token configured',
    provides: ['organized violence events'],
    missingMeans: 'Optional token not configured or no rows returned.',
    url: 'https://ucdp.uu.se'
  },
  {
    id: 'overpass',
    name: 'OpenStreetMap Overpass API',
    category: 'places',
    update: 'on map move/click',
    provides: ['towns', 'cities', 'villages', 'local facilities'],
    missingMeans: 'No local place points loaded for the viewport.',
    url: 'https://overpass-api.de'
  },
  {
    id: 'nominatim',
    name: 'OpenStreetMap Nominatim',
    category: 'geocoding',
    update: 'on search/click',
    provides: ['place search', 'reverse geocoding'],
    missingMeans: 'Place name unavailable; coordinates still work.',
    url: 'https://nominatim.openstreetmap.org'
  },
  {
    id: 'wikipedia',
    name: 'Wikipedia REST summary API',
    category: 'places',
    update: 'on city/town card open',
    provides: ['English summary', 'thumbnail image', 'source link'],
    missingMeans: 'No image/summary shown.',
    url: 'https://en.wikipedia.org/api/rest_v1'
  },
  {
    id: 'wikidata',
    name: 'Wikidata EntityData',
    category: 'places',
    update: 'on city/town card open when OSM wikidata tag exists',
    provides: ['English Wikipedia title resolution'],
    missingMeans: 'Fallback to place name search.',
    url: 'https://www.wikidata.org/wiki/Special:EntityData'
  },
  {
    id: 'polymarket',
    name: 'Polymarket Gamma API',
    category: 'prediction-markets',
    update: 'on refresh',
    provides: ['active market names', 'volume', 'liquidity'],
    missingMeans: 'No Polymarket rows shown.',
    url: 'https://gamma-api.polymarket.com'
  }
];

function getSourceCatalog(){
  return SOURCES;
}

function summarizeCoverage(){
  const byCategory = {};
  for(const source of SOURCES){
    byCategory[source.category] = (byCategory[source.category] || 0) + 1;
  }
  return { total: SOURCES.length, byCategory, sources: SOURCES };
}

module.exports = { SOURCES, getSourceCatalog, summarizeCoverage };
