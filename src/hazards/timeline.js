import {
  bucketHour, timestamp
}
from './time.js';
export function hazardTimeline(events=[], options= {
}) {
  const buckets=new Map();
  for(const event of events) {
    const key=bucketHour(event.time);
    if(!key)continue;
    const bucket=buckets.get(key)|| {
      time:key, count:0, maximumScore:0, types: {
      }
    };
    bucket.count++;
    bucket.maximumScore=Math.max(bucket.maximumScore, event.materiality?.score||0);
    bucket.types[event.type]=(bucket.types[event.type]||0)+1;
    buckets.set(key, bucket);
  }
  const points=[...buckets.values()].sort((a, b)=>timestamp(a.time)-timestamp(b.time));
  const limit=Number(options.limit||500);
  return Object.freeze(points.slice(-limit).map(point=>Object.freeze( {
    ...point, types:Object.freeze(point.types)
  })));
}
