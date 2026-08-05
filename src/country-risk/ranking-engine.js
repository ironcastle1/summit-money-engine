export function rankCountries(profiles = [], options = {
}) {
  const direction=String(options.direction||'DESC').toUpperCase();
  const factor=String(options.factor||'composite');
  const value=profile=>factor==='composite'?Number(profile.risk?.score||0):Number(profile.factors?.[factor]?.score||0);
  return Object.freeze(profiles.slice().sort((a,b)=>(value(b)-value(a))*(direction==='ASC'?-1:1)).map((profile,index)=>Object.freeze({
    ...profile,rank:index+1,rankFactor:factor
  })));
}
