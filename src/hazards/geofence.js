import {
  haversineKm, pointOf, inBounds
}
from './geo.js';
export function matchesGeofence(event, geofence= {
}) {
  if(geofence.bounds&&!inBounds(event.point, geofence.bounds))return false;
  if(geofence.center) {
    const center=pointOf(geofence.center);
    if(!center)return false;
    if(haversineKm(event.point, center)>Number(geofence.radiusKm||100))return false;
  }
  if(Array.isArray(geofence.countries)&&geofence.countries.length&&!geofence.countries.map(x=>String(x).toUpperCase()).includes(String(event.country||'').toUpperCase()))return false;
  if(Array.isArray(geofence.types)&&geofence.types.length&&!geofence.types.includes(event.type))return false;
  return true;
}
