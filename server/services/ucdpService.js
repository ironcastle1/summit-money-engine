const { getJson } = require('./http');

function eventKind(row){
  const t = Number(row.type_of_violence || 0);
  if (t === 1) return 'war';
  if (t === 2) return 'war';
  if (t === 3) return 'terror';
  return 'war';
}
function watchFor(row){
  const country = String(row.country || '').toLowerCase();
  if(country.includes('yemen') || country.includes('sudan') || country.includes('syria') || country.includes('ukraine')) return ['GLD','BRENT','LMT','NOC','local FX'];
  return ['GLD','defence names','local FX','food/fuel prices'];
}
function normalizeUcdp(row){
  const lat = Number(row.latitude); const lng = Number(row.longitude);
  if(!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  const deaths = Number(row.best || row.high || row.deaths_civilians || 0) || 0;
  const kind = eventKind(row);
  const title = `${row.conflict_name || 'Conflict event'} — ${row.where_coordinates || row.country || ''}`;
  return {
    id: `ucdp-${row.id}`,
    kind,
    title,
    lat,
    lng,
    place: row.where_coordinates || row.country || 'UCDP event',
    source: 'UCDP GED',
    url: 'https://ucdp.uu.se/',
    time: row.date_end || row.date_start || `${row.year}-01-01`,
    summary: `${row.dyad_name || row.conflict_name || 'Organized violence'}${deaths ? ` · reported fatalities: ${deaths}` : ''}`,
    watch: watchFor(row),
    sources: [{ name: 'UCDP GED', url: 'https://ucdp.uu.se/' }],
    verifiedLocation: true,
    severity: deaths >= 20 ? 'high' : deaths >= 5 ? 'medium' : 'monitor'
  };
}
async function fetchUcdpEvents({ days = 30, limit = 120 } = {}){
  const token = process.env.UCDP_TOKEN;
  if(!token){
    return { configured:false, status:'UCDP optional: add UCDP_TOKEN if you obtain a free UCDP API token. Using GDELT/ReliefWeb/USGS without it.', events:[] };
  }
  const start = new Date(Date.now() - days*86400000).toISOString().slice(0,10);
  try{
    const url = `https://ucdpapi.pcr.uu.se/api/gedevents/26.1?pagesize=${Math.min(limit,500)}&StartDate=${start}`;
    const data = await getJson(url, { headers:{ 'x-ucdp-access-token': token }, timeout:16000 });
    const rows = Array.isArray(data.Result) ? data.Result : [];
    return { configured:true, status:`UCDP GED connected: ${rows.length} rows`, events:rows.map(normalizeUcdp).filter(Boolean).slice(0,limit) };
  }catch(e){
    return { configured:true, status:`UCDP request failed: ${e.message}`, events:[] };
  }
}
module.exports = { fetchUcdpEvents };
