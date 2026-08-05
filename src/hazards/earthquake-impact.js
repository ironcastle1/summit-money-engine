import {
  clamp, round
}
from './numbers.js';
export function earthquakeImpact(event= {
}) {
  const magnitude=Number(event.magnitude??event.attributes?.magnitude??0);
  const depth=Number(event.attributes?.depthKm??20);
  const significance=Number(event.attributes?.significance??0);
  const felt=Number(event.attributes?.feltReports??0);
  const tsunami=event.attributes?.tsunami===true||event.tsunami===true;
  const shallow=Math.max(0, 1-Math.max(0, depth)/300);
  const magnitudeScore=clamp((magnitude-4.5)*24);
  const score=clamp(magnitudeScore*0.6+shallow*20+Math.min(15, significance/60)+Math.min(10, felt/1000)+(tsunami?25:0));
  return Object.freeze( {
    score:round(score, 1), magnitude:Number.isFinite(magnitude)?magnitude:null, depthKm:Number.isFinite(depth)?depth:null, significance:Number.isFinite(significance)?significance:null, tsunami, shallowFactor:round(shallow, 3)
  });
}
