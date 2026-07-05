const NodeCache = require('node-cache');
const { getJson, postJson } = require('./http');

const cache = new NodeCache({ stdTTL: 60 * 20 });
function clamp(n,min,max){ return Math.max(min, Math.min(max, n)); }
function round(n,d=4){ return Number(Number(n).toFixed(d)); }
function bboxKey(s,w,n,e,z){ return [s,w,n,e,z].map(x=>Number(x).toFixed(2)).join(','); }

async function getLocalPlaces({ south, west, north, east, zoom }){
  south = clamp(Number(south), -85, 85); north = clamp(Number(north), -85, 85);
  west = clamp(Number(west), -180, 180); east = clamp(Number(east), -180, 180);
  zoom = Number(zoom || 8);
  if(!Number.isFinite(south+west+north+east) || north <= south || east <= west) return { ok:false, places:[], reason:'bad bbox' };
  if(zoom < 6) return { ok:true, places:[], reason:'zoom in for town/city layer' };
  const area = Math.abs((north-south)*(east-west));
  if(area > 95) return { ok:true, places:[], reason:'area too large; zoom in for local places' };
  const key = `local:${bboxKey(south,west,north,east,zoom)}`;
  const cached = cache.get(key); if(cached) return cached;
  const q = `
[out:json][timeout:18];
(
  node["place"~"city|town|village|suburb"](${south},${west},${north},${east});
  node["amenity"~"police|hospital|clinic"](${south},${west},${north},${east});
);
out center tags 220;
`;
  try{
    const d = await postJson('https://overpass-api.de/api/interpreter', q, {
      timeout: 22000,
      headers: { 'Content-Type': 'text/plain; charset=utf-8', 'User-Agent':'SummitMoneyEngine/0.14' }
    });
    const places = (d.elements||[]).map(el => {
      const tags = el.tags || {};
      const kind = tags.place ? 'place' : (tags.amenity || 'local');
      const name = tags.name || tags['name:en'] || tags.official_name || kind;
      return {
        id: `osm-${el.type}-${el.id}`,
        name,
        kind,
        lat: round(el.lat || el.center?.lat),
        lng: round(el.lon || el.center?.lon),
        tags: {
          population: tags.population || null,
          place: tags.place || null,
          amenity: tags.amenity || null,
          wikidata: tags.wikidata || null
        },
        source: 'OpenStreetMap / Overpass',
        note: tags.place ? `${tags.place} in current map view` : `${tags.amenity || 'local'} facility in current map view`
      };
    }).filter(p => Number.isFinite(p.lat+p.lng) && p.name).slice(0,220);
    const result = { ok:true, places, count:places.length, source:'OpenStreetMap Overpass API', reason:'source-backed local places/facilities' };
    cache.set(key, result);
    return result;
  }catch(e){
    return { ok:false, places:[], source:'OpenStreetMap Overpass API', reason:e.message || 'Overpass unavailable' };
  }
}
module.exports = { getLocalPlaces };
