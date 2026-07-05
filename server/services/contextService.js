const { countries, mapNodes, cityNodes, safetyCountries, conflictCountries } = require('../data/mapData');
const { countryCodes } = require('../data/countryCodes');
const { getJson } = require('./http');
const { getNationalAverages } = require('./worldBankService');

function dist(a,b,c,d){ return Math.hypot((a-c)*1.15, b-d); }
function nearest(lat,lng,list){ return [...list].sort((a,b)=>dist(lat,lng,a.lat||0,a.lng||0)-dist(lat,lng,b.lat||0,b.lng||0))[0]; }
function monthString(){ const d=new Date(); d.setMonth(d.getMonth()-1); return `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,'0')}`; }
function isUK(lat,lng){ return lat>=49.7 && lat<=60.9 && lng>=-8.8 && lng<=2.2; }
function pointInPoly(lat,lng,poly){
  if(!Array.isArray(poly) || poly.length < 3) return false;
  let inside=false; const x=lng, y=lat;
  for(let i=0,j=poly.length-1;i<poly.length;j=i++){
    const yi=poly[i][0], xi=poly[i][1], yj=poly[j][0], xj=poly[j][1];
    const intersect=((yi>y)!==(yj>y)) && (x < (xj-xi)*(y-yi)/(yj-yi+1e-12)+xi);
    if(intersect) inside=!inside;
  }
  return inside;
}
function centroid(poly){
  if(!Array.isArray(poly)||!poly.length) return {lat:0,lng:0};
  const s=poly.reduce((a,p)=>({lat:a.lat+p[0],lng:a.lng+p[1]}),{lat:0,lng:0});
  return {lat:s.lat/poly.length,lng:s.lng/poly.length};
}
function countryByPoint(lat,lng){
  const direct = (safetyCountries||[]).find(c=>pointInPoly(lat,lng,c.poly));
  if(direct) return direct;
  const withCentroids = (safetyCountries||[]).map(c=>({ ...c, ...centroid(c.poly) }));
  return nearest(lat,lng, withCentroids) || nearest(lat,lng,countries) || null;
}
function countryFromIso2(iso2){ return countryCodes[String(iso2||'').toLowerCase()] || null; }
async function getReverse(lat,lng){
  try{
    const url=`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=14&addressdetails=1&accept-language=en`;
    return await getJson(url,{headers:{'User-Agent':'SummitMoneyEngine/0.17 contact=dashboard'},timeout:8500});
  }catch(e){ return null; }
}
async function getCrime(lat,lng){
  if(!isUK(lat,lng)) return { ok:false, source:'No official local crime feed for this point. Showing national averages and event pressure only.' };
  try{
    const url=`https://data.police.uk/api/crimes-street/all-crime?lat=${lat}&lng=${lng}&date=${monthString()}`;
    const data=await getJson(url,{timeout:9000});
    const counts={}; for(const c of data||[]) counts[c.category]=(counts[c.category]||0)+1;
    const count=(data||[]).length; const level=count>250?'red':count>90?'yellow':'green';
    const top=Object.entries(counts).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([k,v])=>`${k}: ${v}`);
    return { ok:true, count, level, categories:counts, top, source:'data.police.uk street-level crime API; approximate anonymised locations' };
  }catch(e){ return { ok:false, source:'data.police.uk unavailable for this point' }; }
}
function countryEvents(country, events){
  if(!country?.poly) return [];
  return (events||[]).filter(e=>pointInPoly(e.lat,e.lng,country.poly)).slice(0,120);
}
function buildIndexes({ national, crime, conflict, countryEvents, nearEvents, nearNodes }){
  const events = [...(countryEvents||[]), ...(nearEvents||[])];
  const war = events.filter(e=>e.kind==='war').length + (conflict ? 4 : 0);
  const terror = events.filter(e=>e.kind==='terror').length;
  const disaster = events.filter(e=>e.kind==='disaster').length;
  const homicide = national?.homicide?.value;
  let crimeIndex = null;
  let crimeSource = 'No official crime indicator loaded.';
  if(crime?.ok){
    crimeIndex = crime.level==='red' ? 20 : crime.level==='yellow' ? 52 : 78;
    crimeSource = `Official UK street-crime count near click: ${crime.count}`;
  } else if(Number.isFinite(homicide)) {
    // Higher homicide = worse score. 0-1 excellent, 10+ high risk, 30+ severe.
    crimeIndex = Math.round(Math.max(5, Math.min(95, 92 - homicide * 4.4)));
    crimeSource = `World Bank homicide rate: ${homicide.toFixed(2)} per 100k (${national.homicide.year})`;
  }
  let safetyIndex = null;
  if(crimeIndex !== null || war || terror || disaster){
    const base = crimeIndex ?? 62;
    safetyIndex = Math.round(Math.max(3, Math.min(96, base - war*12 - terror*8 - disaster*4 - (conflict?18:0))));
  }
  const financeNodes = (nearNodes||[]).filter(n=>['finance','port','shipping','energy','commodity','ai','tech'].includes(n.kind)).length;
  const marketEvents = events.filter(e=>['shipping','energy','ai','commodity','election'].includes(e.kind)).length;
  const moneyIndex = Math.round(Math.max(0, Math.min(100, financeNodes*7 + marketEvents*5 + ((national?.gdpPerCapita?.value||0)>30000?12:0))));
  return {
    safetyIndex, crimeIndex, moneyIndex,
    source: { crime: crimeSource, safety:'Computed only from source-backed conflict/event counts + official/national crime indicators.', money:'Computed from nearby mapped economic nodes + source-backed market/election/shipping/energy events.' },
    counts: { war, terror, disaster, marketEvents, financeNodes },
    hasRealCrime: crime?.ok || Number.isFinite(homicide),
    hasRealSafety: !!(war || terror || disaster || conflict || crime?.ok || Number.isFinite(homicide)),
    hasMoneyBasis: !!(financeNodes || marketEvents || national?.gdpPerCapita?.value)
  };
}
async function getCountryContext(lat,lng,state){
  const reverse = await getReverse(lat,lng);
  const iso2 = reverse?.address?.country_code;
  const isoInfo = countryFromIso2(iso2);
  const boundaryCountry = countryByPoint(lat,lng);
  const iso3 = boundaryCountry?.iso || isoInfo?.iso3 || null;
  const englishName = isoInfo?.englishName || boundaryCountry?.englishName || boundaryCountry?.name || reverse?.address?.country || 'Unknown country';
  const localName = reverse?.address?.country && reverse.address.country !== englishName ? reverse.address.country : '';
  const placeName = reverse?.display_name || 'Selected area';
  const placeType = reverse?.type || reverse?.category || 'area';
  const nearCities=[...cityNodes].sort((a,b)=>dist(lat,lng,a.lat,a.lng)-dist(lat,lng,b.lat,b.lng)).slice(0,45);
  const nearNodes=[...mapNodes].sort((a,b)=>dist(lat,lng,a.lat,a.lng)-dist(lat,lng,b.lat,b.lng)).slice(0,35);
  const fixedNearEvents=(state.events||[]).sort((a,b)=>dist(lat,lng,a.lat,a.lng)-dist(lat,lng,b.lat,b.lng)).slice(0,80);
  const inCountryEvents=countryEvents(boundaryCountry,state.events||[]);
  const crime=await getCrime(lat,lng);
  const national = await getNationalAverages(iso3);
  const conflict = (conflictCountries||[]).find(c => c.iso === iso3 || c.name === boundaryCountry?.name) || null;
  const indexes = buildIndexes({ national, crime, conflict, countryEvents:inCountryEvents, nearEvents:fixedNearEvents, nearNodes });
  return { country:{ ...(boundaryCountry||{}), iso3, englishName, localName }, reverse:{ ok:!!reverse, place:placeName, address:reverse?.address||{}, type:placeType }, nearCities, nearNodes, nearEvents:fixedNearEvents, inCountryEvents, crime, national, conflict, indexes, clicked:{lat,lng}, feeds:{ conflict: state.conflictFeedStatus || 'GDELT/ReliefWeb/USGS open feeds active; optional UCDP token not checked', crime:'UK local only; global uses national indicators where available', worldBank:'national averages when World Bank publishes them' } };
}
module.exports = { getCountryContext };
