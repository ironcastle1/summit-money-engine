import { cleanText } from './text.js';

export function planFollowUps(signals,{max=5,minScore=72}={}){
  const rows=[]; for(const signal of signals){
    if(rows.length>=max)break; if(signal.signalScore<minScore)continue; if(signal.independentSources>=3&&signal.officialPrimary)continue;
    const terms=keywords(signal.title); const place=signal.strategicNode?.name||signal.location?.name; const topic=signal.category;
    const components=[]; if(place)components.push(`"${escapeTerm(place)}"`); if(terms.length)components.push(`(${terms.slice(0,5).map(x=>`"${escapeTerm(x)}"`).join(' OR ')})`); components.push(`"${escapeTerm(topic)}"`);
    rows.push({id:`followup-${signal.id}`,name:`Follow-up · ${signal.title.slice(0,70)}`,kind:'gdelt',type:'adaptive-corroboration',quality:.72,regionId:signal.regionIds.find(x=>x!=='world')||'world',query:components.join(' '),signalId:signal.id});
  } return rows;
}
function keywords(title){return cleanText(title).split(/[^\p{L}\p{N}-]+/u).filter(x=>x.length>3&&!STOP.has(x.toLowerCase()));}
function escapeTerm(s){return String(s).replace(/["()]/g,' ').trim();}
const STOP=new Set(['with','from','after','over','amid','officials','official','trade','new','says','said','statement','reports']);
