import {
  bearingDegrees, haversineKm
}
from './geo.js';
import {
  timestamp
}
from './time.js';
import {
  round
}
from './numbers.js';
export function buildHazardTrack(events=[]) {
  const ordered=[...events].filter(e=>e?.point).sort((a, b)=>timestamp(a.time)-timestamp(b.time));
  const segments=[];
  for(let i=1;
  i<ordered.length;
  i++) {
    const from=ordered[i-1], to=ordered[i], hours=Math.max(0.001, (timestamp(to.time)-timestamp(from.time))/3_600_000), distance=haversineKm(from.point, to.point);
    segments.push(Object.freeze( {
      fromId:from.id, toId:to.id, distanceKm:round(distance, 1), hours:round(hours, 2), speedKph:round(distance/hours, 1), bearing:round(bearingDegrees(from.point, to.point), 1)
    }));
  }
  const last=segments.at(-1);
  return Object.freeze( {
    points:Object.freeze(ordered.map(e=>Object.freeze( {
      id:e.id, time:e.time, ...e.point
    }))), segments:Object.freeze(segments), motion:last?Object.freeze( {
      speedKph:last.speedKph, bearing:last.bearing
    }):null
  });
}
