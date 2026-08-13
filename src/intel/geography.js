import { reference } from '../catalog/reference.js';
import { REGIONS, REGION_BY_ID, regionForCountry, regionMatchesText } from '../catalog/regions.js';
import { STRATEGIC_NODES } from '../catalog/strategic-nodes.js';
import { STRATEGIC_AREAS } from '../catalog/strategic-areas.js';
import { cleanText } from './text.js';

const aliases=[];
const AMBIGUOUS_ALIASES=new Set(['island','congo','guinea','korea']);
for(const c of reference.countries){
  const names=new Set([c.name,c.nativeName,c.iso2,c.iso3,...(c.aliases||[])]);
  for(const n of names){const a=cleanText(n).toLowerCase();if(a.length>=3&&!AMBIGUOUS_ALIASES.has(a))aliases.push({alias:a,score:100+a.length,location:{kind:'country',name:c.name,localName:c.nativeName||'',countryCode:c.iso2,lat:Number(c.lat),lon:Number(c.lon)}});}
}
for(const city of reference.cities){
  for(const n of new Set([city.name,city.localName])){const a=cleanText(n).toLowerCase();if(a.length>=3)aliases.push({alias:a,score:180+a.length,location:{kind:'city',name:city.name,localName:city.localName||'',country:city.country,countryCode:city.countryCode,lat:Number(city.lat),lon:Number(city.lon)}});}
}
aliases.sort((a,b)=>b.score-a.score);

function boundaryHit(haystack,alias){const escaped=alias.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');return new RegExp(`(?:^|[^\\p{L}\\p{N}])${escaped}(?:$|[^\\p{L}\\p{N}])`,'iu').test(haystack);}
export function locate(record){
  if(Number.isFinite(record?.locationHint?.lat)&&Number.isFinite(record?.locationHint?.lon))return {...record.locationHint};
  const title=` ${cleanText(record?.title||'').toLowerCase()} `;
  const text=` ${cleanText(`${record?.title||''} ${record?.summary||''} ${(record?.countryHints||[]).join(' ')}`).toLowerCase()} `;
  for(const node of STRATEGIC_NODES){if(node.keywords.some(k=>title.includes(k.toLowerCase())))return {kind:node.type,name:node.name,lat:node.lat,lon:node.lon,regionId:node.regionId,nodeId:node.id};}
  for(const area of STRATEGIC_AREAS){if(area.aliases.some(k=>title.includes(k.toLowerCase())))return {kind:area.type,name:area.name,lat:area.lat,lon:area.lon,regionId:area.regionId,areaId:area.id,countryCode:area.countryCode};}
  for(const row of aliases){if(boundaryHit(title,row.alias))return row.location;}
  for(const node of STRATEGIC_NODES){if(node.keywords.some(k=>text.includes(k.toLowerCase())))return {kind:node.type,name:node.name,lat:node.lat,lon:node.lon,regionId:node.regionId,nodeId:node.id};}
  for(const area of STRATEGIC_AREAS){if(area.aliases.some(k=>text.includes(k.toLowerCase())))return {kind:area.type,name:area.name,lat:area.lat,lon:area.lon,regionId:area.regionId,areaId:area.id,countryCode:area.countryCode};}
  for(const row of aliases){if(boundaryHit(text,row.alias))return row.location;}
  return null;
}
export function regionsFor(record,location){
  const ids=new Set(); if(record.regionHint&&REGION_BY_ID.has(record.regionHint))ids.add(record.regionHint);
  if(location?.regionId)ids.add(location.regionId);
  if(location?.countryCode){const r=regionForCountry(location.countryCode);if(r?.id)ids.add(r.id);}
  const text=`${record?.title||''} ${record?.summary||''}`;
  for(const region of REGIONS.filter(r=>r.id!=='world'))if(regionMatchesText(region,text))ids.add(region.id);
  if(!ids.size)ids.add('world'); ids.add('world'); return [...ids];
}
export function nearestStrategicNode(location,maxDegrees=7){
  if(!Number.isFinite(location?.lat)||!Number.isFinite(location?.lon))return null; let best=null;
  for(const node of STRATEGIC_NODES){const d=Math.hypot(location.lat-node.lat,(location.lon-node.lon)*Math.cos(location.lat*Math.PI/180));if(d<=maxDegrees&&(!best||d<best.distance))best={...node,distance:d};}
  return best;
}

export function nearestStrategicArea(location,maxDegrees=5){
  if(!Number.isFinite(location?.lat)||!Number.isFinite(location?.lon))return null; let best=null;
  for(const area of STRATEGIC_AREAS){const d=Math.hypot(location.lat-area.lat,(location.lon-area.lon)*Math.cos(location.lat*Math.PI/180));if(d<=maxDegrees&&(!best||d<best.distance))best={...area,distance:d};}
  return best;
}
