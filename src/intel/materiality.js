import { nearestStrategicNode, nearestStrategicArea } from './geography.js';
import { REGION_BY_ID } from '../catalog/regions.js';
import { COUNTRY_PRIORITY_BY_CODE } from '../catalog/country-priority-profiles.js';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function materiality(record,classification,location,regionIds,now=Date.now()){
  const published=Date.parse(record.publishedAt||''); const age=Number.isFinite(published)?Math.max(0,(now-published)/3600000):72;
  const freshness=clamp(24-age*0.55,0,24);
  const source=clamp((record.sourceQuality??0.5)*22,0,22);
  const topic=clamp((classification.topics.length*3.5)+classification.severity,0,28);
  const region=Math.max(...regionIds.map(id=>REGION_BY_ID.get(id)?.priority||0.8))*12;
  const node=nearestStrategicNode(location); const area=nearestStrategicArea(location);
  const strategic=Math.max(node?clamp(node.importance/100*14,0,14):0,area?clamp(area.importance/100*13,0,13):0);
  const countryPriority=COUNTRY_PRIORITY_BY_CODE.get(location?.countryCode)?.priority||0; const countryBoost=clamp((countryPriority-75)/25*8,0,8);
  const eventBoost=clamp(Math.abs(classification.eventType?.weight||0)*.35,0,8);
  const claimPenalty=clamp((record.claimRisk?.score||0)*.10,0,10);
  const score=clamp(freshness+source+topic+region+strategic+countryBoost+eventBoost-claimPenalty,0,100);
  return {score:Number(score.toFixed(1)),freshness:Number(freshness.toFixed(1)),source:Number(source.toFixed(1)),topic:Number(topic.toFixed(1)),region:Number(region.toFixed(1)),strategic:Number(strategic.toFixed(1)),countryBoost:Number(countryBoost.toFixed(1)),eventBoost:Number(eventBoost.toFixed(1)),claimPenalty:Number(claimPenalty.toFixed(1)),nearestNode:node,nearestArea:area};
}
export function passesMateriality(row){
  if(row.classification.primary==='natural-hazard'&&row.materiality.score<58)return false;
  if((row.sourceQuality??0)<0.55&&row.materiality.score<70)return false;
  return row.materiality.score>=43;
}
