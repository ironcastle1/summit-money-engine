import { respectfulFetch } from '../../market/connectors/http.js';

const NOMINATIM='https://nominatim.openstreetmap.org/search';
const OVERPASS=process.env.MERLIN_OVERPASS_URL||'https://overpass-api.de/api/interpreter';

const CATEGORY_TAGS={
  all:[['amenity','restaurant|cafe|pub|bar|fast_food|clinic|dentist|doctors|veterinary'],['tourism','hotel|guest_house|hostel|motel'],['leisure','fitness_centre|sports_centre'],['shop','.+'],['craft','.+'],['office','company|estate_agent|accountant|lawyer|architect|advertising_agency|financial|it|consulting']],
  restaurants:[['amenity','restaurant|cafe|pub|bar|fast_food']],
  hospitality:[['tourism','hotel|guest_house|hostel|motel'],['amenity','restaurant|cafe|pub|bar']],
  gyms:[['leisure','fitness_centre|sports_centre']],
  barbers:[['shop','hairdresser']],
  retail:[['shop','.+']],
  professional:[['office','company|estate_agent|accountant|lawyer|architect|advertising_agency|financial|it|consulting']],
  automotive:[['shop','car|car_repair|tyres|motorcycle'],['craft','carpenter|metal_construction|electrician|plumber']],
  trades:[['craft','.+']],
};

function escapeRegex(v){return String(v||'').replace(/[\\"\n\r]/g,'');}
function normaliseWebsite(v){if(!v)return null;const s=String(v).trim();if(!s)return null;return /^https?:\/\//i.test(s)?s:`https://${s}`;}
function categoryFromTags(t={}){
  if(t.shop==='hairdresser')return 'barber / hairdresser';
  if(t.leisure==='fitness_centre'||t.leisure==='sports_centre')return 'gym / fitness';
  if(['restaurant','cafe','pub','bar','fast_food'].includes(t.amenity))return t.amenity;
  if(['hotel','guest_house','hostel','motel'].includes(t.tourism))return t.tourism;
  if(t.shop)return `shop: ${t.shop}`;
  if(t.craft)return `trade: ${t.craft}`;
  if(t.office)return `office: ${t.office}`;
  return t.amenity||t.tourism||'business';
}

export async function geocodePlace(query,countryCode='gb'){
  const params=new URLSearchParams({q:query,format:'jsonv2',limit:'1',addressdetails:'1'});
  if(countryCode)params.set('countrycodes',countryCode.toLowerCase());
  const email=process.env.MERLIN_NOMINATIM_EMAIL;if(email)params.set('email',email);
  const {text}=await respectfulFetch(`${NOMINATIM}?${params}`,{headers:{accept:'application/json'},minHostGapMs:1200});
  const rows=JSON.parse(text);if(!rows.length)throw new Error(`Could not geocode ${query}`);
  return {lat:Number(rows[0].lat),lon:Number(rows[0].lon),display_name:rows[0].display_name,address:rows[0].address||{}};
}

export async function scanBusinessesAround({lat,lon,radiusMeters=10000,category='all',limit=500}){
  const r=Math.max(250,Math.min(50000,Number(radiusMeters)||10000));
  const tags=CATEGORY_TAGS[category]||CATEGORY_TAGS.all;
  const parts=[];
  for(const [key,rx] of tags){const k=escapeRegex(key),v=escapeRegex(rx);for(const type of ['node','way','relation'])parts.push(`${type}(around:${r},${lat},${lon})["${k}"~"${v}"]["name"];`);}
  const query=`[out:json][timeout:45];(${parts.join('')});out center tags;`;
  const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),65000);let text;
  try{const response=await fetch(OVERPASS,{method:'POST',signal:controller.signal,headers:{'content-type':'application/x-www-form-urlencoded','user-agent':process.env.MERLIN_RESEARCH_USER_AGENT||'MERLIN-CNC/7.0',accept:'application/json'},body:new URLSearchParams({data:query})});if(!response.ok)throw new Error(`Overpass ${response.status}`);text=await response.text();}finally{clearTimeout(timer);}
  const data=JSON.parse(text);const rows=[];const seen=new Set();
  for(const e of data.elements||[]){
    const t=e.tags||{};const name=t.name?.trim();if(!name)continue;
    const key=`${name.toLowerCase()}|${t['addr:postcode']||''}|${t['addr:street']||''}`;if(seen.has(key))continue;seen.add(key);
    const plat=e.lat??e.center?.lat,plon=e.lon??e.center?.lon;if(plat==null||plon==null)continue;
    const address=[t['addr:housenumber'],t['addr:street'],t['addr:suburb'],t['addr:city']||t['addr:town']||t['addr:village'],t['addr:postcode']].filter(Boolean).join(', ');
    rows.push({
      source:'openstreetmap',source_external_id:`${e.type}/${e.id}`,business_name:name,category:categoryFromTags(t),
      address:address||null,town:t['addr:city']||t['addr:town']||t['addr:village']||null,postcode:t['addr:postcode']||null,
      country:t['addr:country']||null,lat:Number(plat),lon:Number(plon),website:normaliseWebsite(t.website||t['contact:website']),
      email:t.email||t['contact:email']||null,phone:t.phone||t['contact:phone']||null,osm_tags:t
    });
    if(rows.length>=limit)break;
  }
  return rows;
}
