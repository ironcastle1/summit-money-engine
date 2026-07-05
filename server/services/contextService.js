const { countries, mapNodes, cityNodes, safetyCountries, conflictCountries } = require('../data/mapData');
const { countryCodes } = require('../data/countryCodes');
const { getJson } = require('./http');
const { getNationalAverages } = require('./worldBankService');
const { scoreHomicide, scoreLocalCrimeCount, scoreSafety, scoreMoney, indexBand, hasNumber } = require('./indexMath');

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
function countEvents(events){
  const out={ war:0, terror:0, disaster:0, election:0, shipping:0, energy:0, ai:0, commodity:0, finance:0 };
  for(const e of events||[]) if(out[e.kind] !== undefined) out[e.kind]++;
  return out;
}
function buildIndexes({ national, crime, conflict, countryEvents, nearEvents, nearNodes }){
  const inCountry = countryEvents || [];
  const nearby = nearEvents || [];
  const combined = [...inCountry, ...nearby.slice(0,25)];
  const counts = countEvents(combined);
  const financeNodes = (nearNodes||[]).filter(n=>['finance','port','shipping','energy','commodity','ai','tech'].includes(n.kind)).length;
  const marketEvents = counts.shipping + counts.energy + counts.ai + counts.commodity + counts.election + counts.finance;

  let crimeIndex = null;
  let crimeSource = 'N/A - no official local crime feed or World Bank homicide indicator loaded.';
  let crimeFacts = [];
  if(crime?.ok){
    crimeIndex = scoreLocalCrimeCount(crime.count);
    crimeSource = `data.police.uk: ${crime.count} crimes within API search radius for latest available month`;
    crimeFacts = crime.top || [];
  } else if(hasNumber(national?.homicide?.value)) {
    crimeIndex = scoreHomicide(national.homicide.value);
    crimeSource = `World Bank homicide rate: ${national.homicide.value.toFixed(2)} per 100k (${national.homicide.year})`;
    crimeFacts = [`Homicide: ${national.homicide.value.toFixed(2)} per 100k`];
  }

  const safetyIndex = scoreSafety({
    crimeIndex,
    conflict,
    warCount: counts.war,
    terrorCount: counts.terror,
    disasterCount: counts.disaster
  });
  const moneyIndex = scoreMoney(national, financeNodes, marketEvents);

  return {
    safetyIndex, crimeIndex, moneyIndex,
    bands: { safety:indexBand(safetyIndex), crime:indexBand(crimeIndex), money:indexBand(moneyIndex) },
    source: {
      crime: crimeSource,
      safety: safetyIndex === null ? 'N/A - not enough source-backed safety data for this country/point.' : 'Calculated from crime indicator + source-backed war/terror/disaster event counts.',
      money: moneyIndex === null ? 'N/A - not enough economic indicators or market events loaded.' : 'Calculated from World Bank economic indicators + market-relevant events.'
    },
    facts: {
      crime: crimeFacts,
      safety: [
        `${counts.war} war events`, `${counts.terror} terror events`, `${counts.disaster} disaster events`, conflict ? `Conflict overlay: ${conflict.status || conflict.level || 'active'}` : 'No conflict overlay'
      ],
      money: [
        national?.gdpPerCapita ? `GDP/person: $${Math.round(national.gdpPerCapita.value).toLocaleString()} (${national.gdpPerCapita.year})` : 'GDP/person: N/A',
        national?.gdpGrowth ? `GDP growth: ${national.gdpGrowth.value.toFixed(2)}% (${national.gdpGrowth.year})` : 'GDP growth: N/A',
        national?.tradePctGdp ? `Trade/GDP: ${national.tradePctGdp.value.toFixed(1)}% (${national.tradePctGdp.year})` : 'Trade/GDP: N/A',
        `${financeNodes} nearby mapped economic nodes`, `${marketEvents} nearby market-relevant events`
      ]
    },
    counts: { ...counts, marketEvents, financeNodes, inCountryEvents: inCountry.length, nearbyEvents: nearby.length },
    hasRealCrime: crimeIndex !== null,
    hasRealSafety: safetyIndex !== null,
    hasMoneyBasis: moneyIndex !== null
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
