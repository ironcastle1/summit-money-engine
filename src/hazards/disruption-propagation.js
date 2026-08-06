import {
  clamp, round
}
from './numbers.js';
export function propagateDisruption(seed, nodes=[], edges=[], options= {
}) {
  const maximumDepth=Math.max(1, Math.min(8, Number(options.maximumDepth||4)));
  const byId=new Map(nodes.map(n=>[String(n.id), n]));
  const adjacency=new Map();
  for(const edge of edges) {
    const from=String(edge.from), to=String(edge.to);
    if(!adjacency.has(from))adjacency.set(from, []);
    adjacency.get(from).push( {
      ...edge, to
    });
    if(edge.bidirectional!==false) {
      if(!adjacency.has(to))adjacency.set(to, []);
      adjacency.get(to).push( {
        ...edge, to:from
      });
    }
  }
  const scores=new Map([[String(seed.id), clamp(seed.score)]]), queue=[ {
    id:String(seed.id), depth:0, score:clamp(seed.score)
  }];
  while(queue.length) {
    const current=queue.shift();
    if(current.depth>=maximumDepth)continue;
    for(const edge of adjacency.get(current.id)||[]) {
      const attenuation=Number(edge.attenuation??0.68);
      const dependency=Number(edge.dependency??0.8);
      const score=clamp(current.score*attenuation*dependency);
      if(score<10||score<=(scores.get(edge.to)||0))continue;
      scores.set(edge.to, score);
      queue.push( {
        id:edge.to, depth:current.depth+1, score
      });
    }
  }
  return Object.freeze([...scores.entries()].map(([id, score])=>Object.freeze( {
    id, node:byId.get(id)||null, score:round(score, 1)
  })).sort((a, b)=>b.score-a.score));
}
