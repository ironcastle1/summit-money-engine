import { SCENARIOS } from '../catalog/scenarios.js';
import { cleanText } from './text.js';
export function securityAssessment(cluster){
  const text=cleanText(cluster.records.map(r=>`${r.title} ${r.summary}`).join(' ')).toLowerCase(); const regionIds=[...cluster.regionIds];
  const matched=SCENARIOS.filter(s=>(s.regionId==='world'||regionIds.includes(s.regionId))&&s.triggerTerms.some(t=>text.includes(t.toLowerCase())));
  const actions=new Set(),questions=new Set(),confirmations=new Set();
  for(const s of matched){for(const a of s.riskActions)actions.add(a);for(const q of s.decisionQuestions)questions.add(q);for(const c of s.confirmationSignals)confirmations.add(c);}
  if(cluster.primary==='shipping'){actions.add('Check carrier, port and maritime-security notices before relying on media summaries.');actions.add('Map route alternatives and likely added transit time.');}
  if(cluster.primary==='aviation'||text.includes('airspace'))actions.add('Check official NOTAMs and airline operational notices.');
  if(cluster.primary==='cyber')actions.add('Separate confirmed operational impact from unverified attribution claims.');
  return {scenarios:matched.map(s=>({id:s.id,name:s.name})),actions:[...actions].slice(0,8),decisionQuestions:[...questions].slice(0,8),confirmationSignals:[...confirmations].slice(0,8)};
}
