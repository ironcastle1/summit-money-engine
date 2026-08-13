import { REGION_BY_ID } from '../catalog/regions.js';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

export function scoreSignal(cluster,corroboration,market,predictions,context={}){
  const material=cluster.maxMateriality;
  const region=Math.max(...[...cluster.regionIds].map(id=>REGION_BY_ID.get(id)?.priority||0.8));
  const corroborationPoints=corroboration.confidence*.22;
  const transmission=Math.min(17,market.rules.reduce((s,r)=>s+r.matchScore/100*7,0));
  const predictionBoost=predictions.length?Math.min(6,Math.log10(1+Math.max(...predictions.map(p=>p.volume||0)))*1.15):0;
  const escalationBoost=Math.min(8,Math.abs(context.escalation?.score||0)*.10);
  const institutionBoost=Math.min(4,(context.institutions?.[0]?.priority||0)/25);
  const playbookBoost=Math.min(7,(context.playbooks?.[0]?.matchScore||0)*.07);
  const dependencyBoost=Math.min(5,(context.dependencies?.[0]?.relevance||0)*.05);
  const raw=material*.49+corroborationPoints+transmission+predictionBoost+escalationBoost+institutionBoost+playbookBoost+dependencyBoost+(region-1)*10;
  const score=clamp(raw,0,100); const rounded=Math.round(score);
  const urgency=rounded>=86?'CRITICAL':rounded>=74?'HIGH':rounded>=60?'ELEVATED':rounded>=48?'WATCH':'LOW';
  const utility=clamp(score*.67+(market.rules.length?10:0)+(cluster.location?5:0)+(corroboration.independentSources>=2?7:0)+(context.dependencies?.length?5:0)+(context.playbooks?.length?5:0),0,100);
  return {score:rounded,urgency,customerUtility:Math.round(utility)};
}
