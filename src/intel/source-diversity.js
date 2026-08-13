export function sourceDiversity(records){
  const domains=new Set();
  const modes=new Set();
  const alignments=new Set();
  const classes=new Set();
  let independentQuality=0;
  let primaryCount=0;
  let stateControlledCount=0;
  let independentCount=0;

  for(const record of records||[]){
    if(record.sourceDomain)domains.add(record.sourceDomain);
    if(record.sourceMode)modes.add(record.sourceMode);
    if(record.sourceAlignment)alignments.add(record.sourceAlignment);
    if(record.sourceType)classes.add(record.sourceType);
    if(record.sourceMode==='primary-claim'||record.sourceQuality>=.99)primaryCount++;
    if(record.sourceAlignment==='state-controlled')stateControlledCount++;
    else independentCount++;
  }

  const byDomain=new Map();
  for(const record of records||[]){
    const key=record.sourceDomain||record.sourceId||'unknown';
    const current=byDomain.get(key);
    if(!current||Number(record.sourceQuality||0)>Number(current.sourceQuality||0))byDomain.set(key,record);
  }
  for(const record of byDomain.values()){
    let weight=Number(record.sourceQuality||0);
    if(record.sourceAlignment==='state-controlled')weight*=.45;
    if(record.sourceMode==='primary-claim')weight*=.85;
    independentQuality+=weight;
  }

  const domainCount=domains.size;
  const familyBreadth=[modes.size,alignments.size,classes.size].filter(x=>x>1).length;
  const effectiveIndependentSources=Math.min(domainCount,Math.max(0,Math.round(independentQuality*10)/10));
  const score=Math.min(100,
    domainCount*13+
    Math.min(18,familyBreadth*6)+
    Math.min(16,primaryCount*5)+
    Math.min(18,independentCount*4)-
    Math.min(20,stateControlledCount*5)
  );

  return {
    score:Math.max(0,Math.round(score)),
    domainCount,
    effectiveIndependentSources,
    primaryCount,
    stateControlledCount,
    independentCount,
    modes:[...modes],
    alignments:[...alignments],
    classes:[...classes],
    warning:stateControlledCount>0&&independentCount===0
      ?'Evidence is entirely state-controlled or official-claim material.'
      :domainCount<2
        ?'Only one source domain currently supports this event.'
        :null
  };
}
