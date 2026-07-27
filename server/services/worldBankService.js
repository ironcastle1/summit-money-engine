const NodeCache = require('node-cache');
const { getJson } = require('./http');

const cache = new NodeCache({ stdTTL: 60 * 60 * 24 });
const SERIES = {
  homicide: 'VC.IHR.PSRC.P5',
  population: 'SP.POP.TOTL',
  gdpPerCapita: 'NY.GDP.PCAP.CD',
  gdpGrowth: 'NY.GDP.MKTP.KD.ZG',
  inflation: 'FP.CPI.TOTL.ZG',
  unemployment: 'SL.UEM.TOTL.ZS',
  tradePctGdp: 'NE.TRD.GNFS.ZS',
  exportsPctGdp: 'NE.EXP.GNFS.ZS',
  internetUsersPct: 'IT.NET.USER.ZS'
};

async function latestWorldBankValue(iso3, indicator){
  if(!iso3 || !indicator) return null;
  const key = `wb:${iso3}:${indicator}`;
  const cached = cache.get(key);
  if(cached !== undefined) return cached;
  try{
    const url = `https://api.worldbank.org/v2/country/${encodeURIComponent(iso3)}/indicator/${indicator}?format=json&per_page=20`;
    const data = await getJson(url, { timeout: 12000 });
    const rows = Array.isArray(data) ? data[1] || [] : [];
    const hit = rows.find(r => r && r.value !== null && r.value !== undefined && Number.isFinite(Number(r.value)));
    const result = hit ? { value: Number(hit.value), year: hit.date, source: 'World Bank Indicators API', indicator } : null;
    cache.set(key, result);
    return result;
  }catch(e){
    cache.set(key, null, 60 * 30);
    return null;
  }
}

async function getNationalAverages(iso3){
  const entries = await Promise.all(Object.entries(SERIES).map(async ([name, code]) => [name, await latestWorldBankValue(iso3, code)]));
  const obj = Object.fromEntries(entries);
  return {
    iso3,
    ...obj,
    source: 'World Bank Indicators API',
    notes: [
      'National indicators are real country-level figures where World Bank publishes them.',
      'They are not street-level safety, and missing data is shown as N/A.'
    ]
  };
}

module.exports = { getNationalAverages, latestWorldBankValue, SERIES };
