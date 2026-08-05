import {
  addHours
}
from './time.js';
import {
  finite, round
}
from './numbers.js';
export function projectTrack(event, track= {
}, hours=[6, 12, 24, 48]) {
  const motion=track.motion;
  if(!motion)return Object.freeze([]);
  const kmPerDegreeLat=111.32;
  const bearing=motion.bearing*Math.PI/180;
  return Object.freeze(hours.map(offset=> {
    const distance=motion.speedKph*offset;
    const dLat=(Math.cos(bearing)*distance)/kmPerDegreeLat;
    const lonScale=Math.max(0.15, Math.cos(event.point.lat*Math.PI/180));
    const dLon=(Math.sin(bearing)*distance)/(kmPerDegreeLat*lonScale);
    return Object.freeze( {
      validAt:addHours(event.time, offset), hours:offset, point:Object.freeze( {
        lat:round(event.point.lat+dLat, 5), lon:round(((event.point.lon+dLon+540)%360)-180, 5)
      }), uncertaintyKm:round(Math.max(20, distance*0.18+finite(event.attributes?.forecastUncertaintyKm)), 1)
    });
  }));
}
