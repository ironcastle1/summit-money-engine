import { cleanText } from './text.js';

export function attachChangeState(signals,previous=[]){
  return signals.map(signal=>{
    const match=findPrevious(signal,previous); if(!match)return {...signal,change:{state:'NEW',scoreDelta:null,previousId:null}};
    const delta=signal.signalScore-match.signalScore; const state=delta>=10?'ESCALATING':delta<=-10?'COOLING':'CONTINUING';
    return {...signal,change:{state,scoreDelta:delta,previousId:match.id,previousScore:match.signalScore}};
  });
}
function findPrevious(signal,previous){
  let best=null,bestScore=0; for(const candidate of previous){
    if(candidate.category!==signal.category)continue; let score=0;
    if(candidate.location?.name&&candidate.location.name===signal.location?.name)score+=.45;
    if(candidate.regionIds?.some(r=>signal.regionIds?.includes(r)&&r!=='world'))score+=.15;
    score+=jaccard(tokens(signal.title),tokens(candidate.title))*.4;
    if(score>bestScore){best=candidate;bestScore=score;}
  }
  return bestScore>=.52?best:null;
}
function tokens(s){return new Set(cleanText(s).toLowerCase().split(/[^a-z0-9]+/).filter(x=>x.length>3&&!STOP.has(x)));}
function jaccard(a,b){let i=0;for(const x of a)if(b.has(x))i++;const u=new Set([...a,...b]).size;return u?i/u:0;}
const STOP=new Set(['with','from','that','this','after','amid','over','into','says','said','official','officials','new']);
