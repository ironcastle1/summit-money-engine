export function buildDecisionSummary(signals){
  const rows=signals||[];
  const escalating=rows
    .filter(s=>s.intelligence?.escalation?.direction==='ESCALATING')
    .sort((a,b)=>b.signalScore-a.signalScore)
    .slice(0,8);
  const deescalating=rows
    .filter(s=>s.intelligence?.escalation?.direction==='DE-ESCALATING')
    .sort((a,b)=>b.signalScore-a.signalScore)
    .slice(0,5);
  const marketLinked=rows
    .filter(s=>s.market?.rules?.length||s.intelligence?.exposures?.length)
    .sort((a,b)=>(b.customerUtility||0)-(a.customerUtility||0))
    .slice(0,10);
  const securityLinked=rows
    .filter(s=>s.security?.actions?.length||s.intelligence?.playbooks?.length)
    .sort((a,b)=>b.signalScore-a.signalScore)
    .slice(0,10);

  const assets=new Map();
  for(const signal of rows){
    for(const exposure of signal.intelligence?.exposures||[]){
      const current=assets.get(exposure.id)||{
        id:exposure.id,
        name:exposure.name,
        kind:exposure.kind,
        relevance:0,
        signalCount:0,
        signals:[]
      };
      current.relevance=Math.max(current.relevance,exposure.relevance||0);
      current.signalCount++;
      current.signals.push({id:signal.id,title:signal.title,score:signal.signalScore});
      assets.set(exposure.id,current);
    }
  }

  const dependencies=new Map();
  for(const signal of rows){
    for(const dependency of signal.intelligence?.dependencies||[]){
      const current=dependencies.get(dependency.id)||{
        id:dependency.id,
        origin:dependency.origin,
        destination:dependency.destination,
        flow:dependency.flow,
        relevance:0,
        signalCount:0
      };
      current.relevance=Math.max(current.relevance,dependency.relevance||0);
      current.signalCount++;
      dependencies.set(dependency.id,current);
    }
  }

  const highest=rows[0]||null;
  return {
    posture:highest
      ?highest.urgency==='CRITICAL'?'IMMEDIATE ATTENTION'
        :highest.urgency==='HIGH'?'HEIGHTENED'
          :'MONITOR'
      :'QUIET',
    highestSignal:highest?{
      id:highest.id,
      title:highest.title,
      score:highest.signalScore,
      urgency:highest.urgency,
      location:highest.location?.name||null
    }:null,
    escalating:escalating.map(compact),
    deescalating:deescalating.map(compact),
    marketLinked:marketLinked.map(compact),
    securityLinked:securityLinked.map(compact),
    concentratedExposures:[...assets.values()]
      .sort((a,b)=>b.relevance-a.relevance||b.signalCount-a.signalCount)
      .slice(0,12),
    stressedDependencies:[...dependencies.values()]
      .sort((a,b)=>b.relevance-a.relevance||b.signalCount-a.signalCount)
      .slice(0,12)
  };
}

function compact(signal){
  return {
    id:signal.id,
    title:signal.title,
    score:signal.signalScore,
    urgency:signal.urgency,
    category:signal.category,
    location:signal.location?.name||null,
    change:signal.change?.state||null,
    escalation:signal.intelligence?.escalation?.direction||null,
    playbook:signal.intelligence?.playbooks?.[0]?.name||null,
    topExposure:signal.intelligence?.exposures?.[0]?.name||null
  };
}
