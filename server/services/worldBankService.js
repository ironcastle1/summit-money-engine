const NodeCache = require('node-cache');
const { getJson } = require('./http');

const cache = new NodeCache({ stdTTL: 60 * 60 * 24 });
const SERIES = {
  homicide: 'VC.IHR.PSRC.P5',
  population: 'SP.POP.TOTL',
  gdpPerCapita: 'NY.GDP.PCAP.CD'
};

async function latestWorldBankValue(iso3, indicator){
  if(!iso3 || !indicator) return null;
  const key = `wb:${iso3}:${indicator}`;
  const cached = cache.get(key);
  if(cached !== undefined) return cached;
  try{
    const url = `https://api.worldbank.org/v2/country/${encodeURIComponent(iso3)}/indicator/${indicator}?format=json&per_page=12`;
    const data = await getJson(url, { timeout: 9000 });
    const rows = Array.isArray(data) ? data[1] || [] : [];
    const hit = rows.find(r => r && r.value !== null && r.value !== undefined);
    const result = hit ? { value: Number(hit.value), year: hit.date, source: 'World Bank Indicators API', indicator } : null;
    cache.set(key, result);
    return result;
  }catch(e){
    cache.set(key, null, 60 * 30);
    return null;
  }
}

async function getNationalAverages(iso3){
  const [homicide, population, gdpPerCapita] = await Promise.all([
    latestWorldBankValue(iso3, SERIES.homicide),
    latestWorldBankValue(iso3, SERIES.population),
    latestWorldBankValue(iso3, SERIES.gdpPerCapita)
  ]);
  return {
    iso3,
    homicide,
    population,
    gdpPerCapita,
    notes: [
      'National averages are broad indicators, not street-level safety.',
      'City and district safety requires local official feeds; unknown is not treated as safe.'
    ]
  };
}

module.exports = { getNationalAverages };
