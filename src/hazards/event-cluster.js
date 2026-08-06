import {
  haversineKm
}
from './geo.js';
import {
  timestamp
}
from './time.js';
export function clusterHazards(events=[], options= {
}) {
  const distanceKm=Number(options.distanceKm||150), windowMs=Number(options.windowHours||48)*3_600_000, clusters=[];
  for(const event of events) {
    let cluster=clusters.find(item=>item.type===event.type&&haversineKm(item.centroid, event.point)<=distanceKm&&Math.abs(timestamp(item.latest)-timestamp(event.time))<=windowMs);
    if(!cluster) {
      cluster= {
        id:`cluster-${clusters.length+1}`, type:event.type, events:[], centroid: {
          ...event.point
        }, latest:event.time, maximumScore:0
      };
      clusters.push(cluster);
    }
    cluster.events.push(event);
    cluster.latest=timestamp(event.time)>timestamp(cluster.latest)?event.time:cluster.latest;
    cluster.maximumScore=Math.max(cluster.maximumScore, event.materiality?.score||event.severityScore||0);
    const count=cluster.events.length;
    cluster.centroid= {
      lat:(cluster.centroid.lat*(count-1)+event.point.lat)/count, lon:(cluster.centroid.lon*(count-1)+event.point.lon)/count
    };
  }
  return Object.freeze(clusters.map(cluster=>Object.freeze( {
    ...cluster, eventIds:Object.freeze(cluster.events.map(e=>e.id)), events:undefined, count:cluster.events.length, centroid:Object.freeze(cluster.centroid)
  })));
}
