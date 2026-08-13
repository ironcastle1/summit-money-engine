const STOP=new Set('the a an and or for of to in on at by from with into over after before as is are was were be been being this that these those it its their his her new says said amid about around across between against through due more most less than will would could should may might can has have had'.split(' '));
const CANONICAL=new Map(Object.entries({iranian:'iran',russian:'russia',chinese:'china',taiwanese:'taiwan',japanese:'japan',korean:'korea',american:'america',british:'britain',european:'europe',israeli:'israel',saudi:'saudi-arabia'}));
export function cleanText(value){return String(value||'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();}
export function tokens(value){
  const prepared=cleanText(value).replace(/\bU\.S\.\b/g,'United States').replace(/\bU\.S\b/g,'United States').replace(/\bUS\b/g,'United States').replace(/\bUAE\b/g,'United Arab Emirates');
  return prepared.toLowerCase().replace(/[^\p{L}\p{N}\- ]/gu,' ').split(/\s+/).filter(x=>x.length>2&&!STOP.has(x)).map(x=>CANONICAL.get(x)||x);
}
export function tokenSet(value){return new Set(tokens(value));}
export function jaccard(a,b){const A=a instanceof Set?a:tokenSet(a),B=b instanceof Set?b:tokenSet(b);if(!A.size||!B.size)return 0;let n=0;for(const x of A)if(B.has(x))n++;return n/(A.size+B.size-n);}
export function normalizeTitle(value){return tokens(value).slice(0,18).sort().join(' ');}
export function containsPhrase(text,phrase){const h=` ${cleanText(text).toLowerCase()} `,p=String(phrase||'').toLowerCase().trim();return p&&h.includes(p);}
