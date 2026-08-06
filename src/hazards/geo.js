import {
  finite, clamp
}
from './numbers.js';
const R = 6371.0088;
function radians(value) {
  return finite(value) * Math.PI / 180;
}
export function validPoint(point) {
  return point && Number.isFinite(Number(point.lat)) && Number.isFinite(Number(point.lon)) && Math.abs(Number(point.lat)) <= 90 && Math.abs(Number(point.lon)) <= 180;
}
export function pointOf(value) {
  const lat = Number(value?.lat ?? value?.latitude ?? value?.coordinates?.lat);
  const lon = Number(value?.lon ?? value?.lng ?? value?.longitude ?? value?.coordinates?.lon);
  return validPoint( {
    lat, lon
  }) ? Object.freeze( {
    lat, lon
  }) : null;
}
export function haversineKm(a, b) {
  if (!validPoint(a)||!validPoint(b)) return Infinity;
  const dLat=radians(b.lat-a.lat), dLon=radians(b.lon-a.lon);
  const x=Math.sin(dLat/2)**2+Math.cos(radians(a.lat))*Math.cos(radians(b.lat))*Math.sin(dLon/2)**2;
  return 2*R*Math.asin(Math.sqrt(clamp(x, 0, 1)));
}
export function bearingDegrees(a, b) {
  if(!validPoint(a)||!validPoint(b)) return null;
  const p1=radians(a.lat), p2=radians(b.lat), dl=radians(b.lon-a.lon);
  const y=Math.sin(dl)*Math.cos(p2), x=Math.cos(p1)*Math.sin(p2)-Math.sin(p1)*Math.cos(p2)*Math.cos(dl);
  return (Math.atan2(y, x)*180/Math.PI+360)%360;
}
export function inBounds(point, bounds) {
  if(!bounds||!validPoint(point)) return true;
  const lat=Number(point.lat), lon=Number(point.lon);
  const south=Number(bounds.south), north=Number(bounds.north), west=Number(bounds.west), east=Number(bounds.east);
  if(![south, north, west, east].every(Number.isFinite)) return true;
  const lonOk=west<=east ? lon>=west&&lon<=east : lon>=west||lon<=east;
  return lat>=south&&lat<=north&&lonOk;
}
export function circlePolygon(center, radiusKm, steps=48) {
  if(!validPoint(center)) return [];
  const latRad=radians(center.lat), angular=finite(radiusKm)/R, points=[];
  for(let i=0;
  i<=steps;
  i++) {
    const bearing=2*Math.PI*i/steps;
    const lat=Math.asin(Math.sin(latRad)*Math.cos(angular)+Math.cos(latRad)*Math.sin(angular)*Math.cos(bearing));
    const lon=radians(center.lon)+Math.atan2(Math.sin(bearing)*Math.sin(angular)*Math.cos(latRad), Math.cos(angular)-Math.sin(latRad)*Math.sin(lat));
    points.push([((lon*180/Math.PI+540)%360)-180, lat*180/Math.PI]);
  }
  return points;
}
