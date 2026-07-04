const { countries, mapNodes, cityNodes } = require('../data/mapData');
const { getJson } = require('./http');
function dist(a,b,c,d){ return Math.hypot((a-c)*1.15, b-d); }
function nearest(lat,lng,list){ return [...list].sort((a,b)=>dist(lat,lng,a.lat,a.lng)-dist(lat,lng,b.lat,b.lng))[0]; }
function monthString(){ const d=new Date(); d.setMonth(d.getMonth()-1); return `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,'0')}`; }
function isUK(lat,lng){ return lat>=49.7 && lat<=60.9 && lng>=-8.8 && lng<=2.2; }
async function getCrime(lat,lng){
  if(!isUK(lat,lng)) return { ok:false, source:'crime feed not connected for this country' };
  try{ const url=`https://data.police.uk/api/crimes-street/all-crime?lat=${lat}&lng=${lng}&date=${monthString()}`; const data=await getJson(url,{timeout:9000}); const counts={}; for(const c of data||[]) counts[c.category]=(counts[c.category]||0)+1; const top=Object.entries(counts).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([k,v])=>`${k}: ${v}`).join(' · '); const count=(data||[]).length; const level=count>250?'red':count>90?'yellow':'green'; return { ok:true, count, level, summary:`Police.uk reports within about 1 mile for last available month: ${count}. ${top||'No category breakdown.'}`, source:'data.police.uk street-level crime API' }; }catch(e){ return { ok:false, source:'data.police.uk unavailable for this point' }; }
}
function safetyFromEvents(lat,lng,events,crime){
  const near=(events||[]).filter(e=>dist(lat,lng,e.lat,e.lng)<3.5 && ['war','terror','disaster'].includes(e.kind));
  let level='green'; let explain='No nearby verified war, terror or disaster reports in the current feed.';
  if(near.some(e=>['war','terror'].includes(e.kind)) || crime?.level==='red'){ level='red'; explain='Recent war/terror reports or high local crime feed near this point. Treat travel/property risk as elevated until verified.'; }
  else if(near.length || crime?.level==='yellow'){ level='yellow'; explain='Some risk pressure nearby. Check event sources and local crime feed before travel or asset decisions.'; }
  return { level, explain, nearCount:near.length };
}
async function getCountryContext(lat,lng,state){
  const country=nearest(lat,lng,countries); const nearCities=[...cityNodes].sort((a,b)=>dist(lat,lng,a.lat,a.lng)-dist(lat,lng,b.lat,b.lng)).slice(0,22); const nearNodes=[...mapNodes].sort((a,b)=>dist(lat,lng,a.lat,a.lng)-dist(lat,lng,b.lat,b.lng)).slice(0,22); const nearEvents=(state.events||[]).sort((a,b)=>dist(lat,lng,a.lat,a.lng)-dist(lat,lng,b.lat,b.lng)).slice(0,42); const crime=await getCrime(lat,lng); const safety=safetyFromEvents(lat,lng,state.events||[],crime); return { country, nearCities, nearNodes, nearEvents, crime, safety, clicked:{lat,lng}, note:'No fabricated crime/election numbers: source-backed only. Global crime needs a licensed source; UK uses data.police.uk.' };
}
module.exports = { getCountryContext };
