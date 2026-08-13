import { INSTITUTIONS } from '../catalog/institutions.js';
import { cleanText } from './text.js';

export function linkInstitutions(input){
  const text=cleanText(Array.isArray(input)?input.map(x=>`${x.title||''} ${x.summary||''}`).join(' '):`${input?.title||''} ${input?.summary||''}`).toLowerCase();
  const rows=[];
  for(const institution of INSTITUTIONS){
    const hits=institution.aliases.filter(alias=>boundary(text,alias.toLowerCase()));
    if(!hits.length)continue;
    rows.push({...institution,hits,matchScore:Math.min(100,institution.priority*.55+hits.length*18)});
  }
  return rows.sort((a,b)=>b.matchScore-a.matchScore).slice(0,8);
}
function boundary(text,term){const escaped=term.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');return new RegExp(`(?:^|[^\\p{L}\\p{N}])${escaped}(?:$|[^\\p{L}\\p{N}])`,'iu').test(text);}
