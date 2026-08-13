import { EVENT_TAXONOMY } from '../catalog/event-taxonomy.js';
import { cleanText } from './text.js';

export function matchEventTypes(record){
  const title=cleanText(record?.title||'').toLowerCase();
  const summary=cleanText(record?.summary||'').toLowerCase();
  const text=`${title} ${summary}`;
  const matches=[];
  for(const type of EVENT_TAXONOMY){
    if(type.excludeTerms?.some(term=>text.includes(term.toLowerCase())))continue;
    const hits=type.terms.filter(term=>text.includes(term.toLowerCase()));
    if(!hits.length)continue;
    const titleHits=type.terms.filter(term=>title.includes(term.toLowerCase())).length;
    const score=Math.min(100,Math.abs(type.weight)*2+hits.length*12+titleHits*10);
    matches.push({id:type.id,name:type.name,category:type.category,weight:type.weight,attentionWindowHours:type.attentionWindowHours,whyItMatters:type.whyItMatters,hits,score});
  }
  return matches.sort((a,b)=>b.score-a.score||Math.abs(b.weight)-Math.abs(a.weight)).slice(0,4);
}
