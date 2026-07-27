const { getJson } = require('./http');

function cleanPlace(row){
  const lat = Number(row.lat);
  const lng = Number(row.lon);
  if(!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  const address = row.address || {};
  const name = row.name || address.city || address.town || address.village || address.country || row.display_name;
  return {
    id: `nominatim-${row.place_id}`,
    name,
    displayName: row.display_name || name,
    lat,
    lng,
    type: row.type || row.class || 'place',
    category: row.class || 'place',
    importance: Number.isFinite(Number(row.importance)) ? Number(row.importance) : null,
    country: address.country || null,
    countryCode: address.country_code || null,
    source: 'OpenStreetMap Nominatim',
    license: row.licence || 'OpenStreetMap contributors'
  };
}

async function searchPlaces(query, limit=8){
  const q = String(query || '').trim();
  if(q.length < 2) return { ok:false, places:[], reason:'Enter at least 2 characters.' };
  const max = Math.max(1, Math.min(12, Number(limit) || 8));
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=${max}&accept-language=en&q=${encodeURIComponent(q)}`;
  try{
    const rows = await getJson(url, {
      timeout: 10000,
      headers: { 'User-Agent':'SummitMoneyEngine/1.0 contact=dashboard' }
    });
    const places = (rows || []).map(cleanPlace).filter(Boolean);
    return { ok:true, places, count:places.length, source:'OpenStreetMap Nominatim' };
  }catch(e){
    return { ok:false, places:[], reason:e.message || 'Nominatim unavailable', source:'OpenStreetMap Nominatim' };
  }
}

module.exports = { searchPlaces };
