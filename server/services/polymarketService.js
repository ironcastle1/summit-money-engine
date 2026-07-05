const { getJson } = require('./http');
function clean(m){
  const q = m.question || m.title || 'Polymarket event';
  const end = m.endDate || m.end_date || null;
  const vol = Number(m.volume || m.volumeNum || 0);
  const liq = Number(m.liquidity || m.liquidityNum || 0);
  return { id:String(m.id||m.conditionId||q).slice(0,64), question:q, volume:vol, liquidity:liq, endDate:end, url:m.slug ? `https://polymarket.com/event/${m.slug}` : 'https://polymarket.com/markets' };
}
async function fetchPolymarket(){
  const urls = [
    'https://gamma-api.polymarket.com/markets?active=true&closed=false&limit=40&order=volume&ascending=false',
    'https://gamma-api.polymarket.com/events?active=true&closed=false&limit=40&order=volume&ascending=false'
  ];
  for(const url of urls){
    try{
      const d = await getJson(url, { timeout: 10000 });
      const arr = Array.isArray(d) ? d : (d.markets || d.events || []);
      return arr.slice(0,30).map(clean);
    }catch(e){}
  }
  return [];
}
module.exports = { fetchPolymarket };
