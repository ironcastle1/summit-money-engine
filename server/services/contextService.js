const { countries, mapNodes } = require('../data/mapData');
function dist(a,b,c,d){ return Math.hypot((a-c)*1.15, b-d); }
function nearest(lat,lng,list){ return [...list].sort((a,b)=>dist(lat,lng,a.lat,a.lng)-dist(lat,lng,b.lat,b.lng))[0]; }
function getCountryContext(lat,lng,state){
  const country = nearest(lat,lng,countries);
  const nearNodes = [...mapNodes].sort((a,b)=>dist(lat,lng,a.lat,a.lng)-dist(lat,lng,b.lat,b.lng)).slice(0,8);
  const nearEvents = (state.events||[]).sort((a,b)=>dist(lat,lng,a.lat,a.lng)-dist(lat,lng,b.lat,b.lng)).slice(0,12);
  return { country, nearNodes, nearEvents, clicked:{ lat,lng } };
}
module.exports = { getCountryContext };
