const { countries, mapNodes, cityNodes } = require('../data/mapData');
const { getJson } = require('./http');
function dist(a,b,c,d){ return Math.hypot((a-c)*1.15, b-d); }
function nearest(lat,lng,list){ return [...list].sort((a,b)=>dist(lat,lng,a.lat,a.lng)-dist(lat,lng,b.lat,b.lng))[0]; }
function monthString(){ const d=new Date(); d.setMonth(d.getMonth()-1); return `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,'0')}`; }
function isUK(lat,lng){ return lat>=49.7 && lat<=60.9 && lng>=-8.8 && lng<=2.2; }
async function getCrime(lat,lng){
  if(!isUK(lat,lng)) return { ok:false, source:'crime feed not connected for this country' };
  try{
    const url=`https://data.police.uk/api/crimes-street/all-crime?lat=${lat}&lng=${lng}&date=${monthString()}`;
    const data=await getJson(url,{ timeout:9000 });
    const counts={}; for(const c of data||[]) counts[c.category]=(counts[c.category]||0)+1;
    const top=Object.entries(counts).sort((a,b)=>b[1]-a[1]).slice(0,4).map(([k,v])=>`${k}: ${v}`).join(' · ');
    return { ok:true, count:(data||[]).length, summary:`Police.uk nearby street-crime reports last available month: ${(data||[]).length}. ${top||'No category breakdown.'}`, source:'data.police.uk street-level crime API' };
  }catch(e){ return { ok:false, source:'data.police.uk unavailable for this point' }; }
}
async function getCountryContext(lat,lng,state){
  const country = nearest(lat,lng,countries);
  const nearCities = [...cityNodes].sort((a,b)=>dist(lat,lng,a.lat,a.lng)-dist(lat,lng,b.lat,b.lng)).slice(0,16);
  const nearNodes = [...mapNodes].sort((a,b)=>dist(lat,lng,a.lat,a.lng)-dist(lat,lng,b.lat,b.lng)).slice(0,16);
  const nearEvents = (state.events||[]).sort((a,b)=>dist(lat,lng,a.lat,a.lng)-dist(lat,lng,b.lat,b.lng)).slice(0,30);
  const crime = await getCrime(lat,lng);
  return { country, nearCities, nearNodes, nearEvents, crime, clicked:{ lat,lng }, note:'No fabricated scores: event, market, crime and election data are shown only when a connected source provides them.' };
}
module.exports = { getCountryContext };
