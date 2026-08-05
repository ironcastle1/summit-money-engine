import {
  infrastructureExposure
}
from './infrastructure-exposure.js';
import {
  round
}
from './numbers.js';
export function portfolioExposure(events=[], assets=[], options= {
}) {
  const byAsset=new Map();
  for(const event of events) {
    const result=infrastructureExposure(event, assets, options);
    for(const item of result.assets) {
      const current=byAsset.get(item.id)|| {
        ...item, maximumScore:0, eventIds:[], types:new Set()
      };
      current.maximumScore=Math.max(current.maximumScore, item.exposureScore);
      current.eventIds.push(event.id);
      current.types.add(event.type);
      byAsset.set(item.id, current);
    }
  }
  const ranked=[...byAsset.values()].map(item=>Object.freeze( {
    ...item, maximumScore:round(item.maximumScore, 1), eventIds:Object.freeze(item.eventIds), types:Object.freeze([...item.types])
  })).sort((a, b)=>b.maximumScore-a.maximumScore);
  return Object.freeze( {
    assets:Object.freeze(ranked), count:ranked.length, critical:ranked.filter(x=>x.maximumScore>=75).length, generatedAt:new Date().toISOString()
  });
}
