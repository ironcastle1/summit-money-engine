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
    return await getJson(url,{headers:{'User-Agent':'SummitMoneyEngine/0.14 contact=dashboard'},timeout:8500});
  }catch(e){ return null; }
}
async function getCrime(lat,lng){
  if(!isUK(lat,lng)) return { ok:false, source:'No official local crime feed connected here. National indicators only.' };
  try{
    const url=`https://data.police.uk/api/crimes-street/all-crime?lat=${lat}&lng=${lng}&date=${monthString()}`;
    const data=await getJson(url,{timeout:9000});
    const counts={}; for(const c of data||[]) counts[c.category]=(counts[c.category]||0)+1;
    const top=Object.entries(counts).sort((a,b)=>b[1]-a[1]).slice(0,7).map(([k,v])=>`${k}: ${v}`).join(' · ');
    const count=(data||[]).length; const level=count>250?'red':count>90?'yellow':'green';
    return { ok:true, count, level, categories:counts, summary:`Official police.uk street-level crimes within about 1 mile for the latest available month: ${count}. ${top||'No category breakdown.'}`, source:'data.police.uk street-level crime API; approximate anonymised locations' };
  }catch(e){ return { ok:false, source:'data.police.uk unavailable for this point' }; }
}
function safetyFromEvents(lat,lng,events,crime){
  const near=(events||[]).filter(e=>dist(lat,lng,e.lat,e.lng)<3.5 && ['war','terror','disaster'].includes(e.kind));
  let level='green'; let explain='No nearby source-backed war, terror or disaster reports in the current feed.';
  if(near.some(e=>['war','terror'].includes(e.kind)) || crime?.level==='red'){ level='red'; explain='Recent war/terror reports or high official local crime feed near this point.'; }
  else if(near.length || crime?.level==='yellow'){ level='yellow'; explain='Some nearby risk pressure. Check event sources and local official feeds before travel or asset decisions.'; }
  return { level, explain, nearCount:near.length };
}
function countryEvents(country, events){
  if(!country?.poly) return [];
  return (events||[]).filter(e=>pointInPoly(e.lat,e.lng,country.poly)).slice(0,80);
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
  const nearEvents=(state.events||[]).sort((a,b)=>dist(lat,lng,a.lat,a.lng)-dist(lat,lng,b.lat,b.lng)).slice(0,80);
  const inCountryEvents=countryEvents(boundaryCountry,state.events||[]);
  const crime=await getCrime(lat,lng);
  const safety=safetyFromEvents(lat,lng,state.events||[],crime);
  const national = await getNationalAverages(iso3);
  const conflict = (conflictCountries||[]).find(c => c.iso === iso3 || c.name === boundaryCountry?.name) || null;
  return { country:{ ...(boundaryCountry||{}), iso3, englishName, localName }, reverse:{ ok:!!reverse, place:placeName, address:reverse?.address||{}, type:placeType }, nearCities, nearNodes, nearEvents, inCountryEvents, crime, safety, national, conflict, clicked:{lat,lng}, feeds:{ conflict: state.conflictFeedStatus || 'GDELT/ReliefWeb/USGS open feeds active; optional UCDP token not checked', x:'X Live removed; no fake X data', crime:'UK local only; global needs official/licensed feeds', worldBank:'national averages when World Bank publishes them' } };
}
module.exports = { getCountryContext };
