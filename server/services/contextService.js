const { countries, mapNodes, cityNodes } = require('../data/mapData');
function dist(a,b,c,d){ return Math.hypot((a-c)*1.15, b-d); }
function nearest(lat,lng,list){ return [...list].sort((a,b)=>dist(lat,lng,a.lat,a.lng)-dist(lat,lng,b.lat,b.lng))[0]; }
function getCountryContext(lat,lng,state){
  const country = nearest(lat,lng,countries);
  const nearCities = [...cityNodes].sort((a,b)=>dist(lat,lng,a.lat,a.lng)-dist(lat,lng,b.lat,b.lng)).slice(0,10);
  const nearNodes = [...mapNodes].sort((a,b)=>dist(lat,lng,a.lat,a.lng)-dist(lat,lng,b.lat,b.lng)).slice(0,10);
  const nearEvents = (state.events||[]).sort((a,b)=>dist(lat,lng,a.lat,a.lng)-dist(lat,lng,b.lat,b.lng)).slice(0,20);
  return { country, nearCities, nearNodes, nearEvents, clicked:{ lat,lng }, note:'Location data is shown only when a source or configured baseline node exists. Crime/election APIs are not guessed.' };
}
module.exports = { getCountryContext };
