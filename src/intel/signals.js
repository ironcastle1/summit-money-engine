import { assessCorroboration } from './corroboration.js';
import { marketReadThrough } from './market-impact.js';
import { linkPredictions } from './prediction-linker.js';
import { securityAssessment } from './security-actions.js';
import { scoreSignal } from './signal-score.js';
import { linkInstitutions } from './institution-linker.js';
import { assessEscalation } from './escalation-analysis.js';
import { mapExposures } from './exposure-engine.js';
import { matchPlaybooks } from './playbook-matcher.js';
import { affectedDependencies } from './dependency-impact.js';
import { stableId } from '../core/hash.js';
import { matchPublicSignalIndicators } from './public-signal-context.js';

export function buildSignals(clusters,predictions){
  const signals=[];
  for(const cluster of clusters){
    const corroboration=assessCorroboration(cluster);
    const market=marketReadThrough(cluster);
    const linkedPredictions=linkPredictions(cluster,predictions);
    const institutions=linkInstitutions(cluster.records);
    const escalation=assessEscalation(cluster);
    const exposures=mapExposures(cluster,market);
    const playbooks=matchPlaybooks(cluster,{institutions,escalation});
    const dependencies=affectedDependencies(cluster,{market,exposures});
    const security=securityAssessment(cluster);
    const publicIndicators=matchPublicSignalIndicators(cluster);
    const scored=scoreSignal(cluster,corroboration,market,linkedPredictions,{institutions,escalation,playbooks,dependencies});
    if(scored.score<48)continue;

    const lead=cluster.records.slice().sort((a,b)=>(b.sourceQuality-a.sourceQuality)||(b.materiality.score-a.materiality.score))[0];
    const anchor=cluster.records.find(r=>r.materiality?.nearestNode||r.materiality?.nearestArea)?.materiality||{};
    signals.push({
      id:stableId('signal',cluster.primary,lead.title,cluster.location?.name||''),
      title:lead.title,
      summary:lead.summary||cluster.records.find(r=>r.summary)?.summary||'',
      category:cluster.primary,
      eventType:lead.classification?.eventType||null,
      publishedAt:cluster.latestAt,
      regionIds:[...cluster.regionIds],
      location:cluster.location,
      strategicNode:anchor.nearestNode||null,
      strategicArea:anchor.nearestArea||null,
      signalScore:scored.score,
      urgency:scored.urgency,
      customerUtility:scored.customerUtility,
      confidence:corroboration.confidence,
      evidenceGrade:corroboration.grade,
      independentSources:corroboration.independentSources,
      officialPrimary:corroboration.officialPrimary,
      evidence:corroboration.evidence,
      market,
      security,
      predictions:linkedPredictions,
      intelligence:{
        escalation,
        institutions:institutions.map(compactInstitution),
        exposures:exposures.map(compactExposure),
        playbooks:playbooks.map(compactPlaybook),
        dependencies:dependencies.map(compactDependency),
        publicIndicators
      },
      recordCount:cluster.records.length,
      whyItMatters:whyItMatters(cluster,market,security,escalation,dependencies),
      verification:verification(corroboration,linkedPredictions,lead)
    });
  }
  return signals.sort((a,b)=>b.signalScore-a.signalScore||Date.parse(b.publishedAt)-Date.parse(a.publishedAt));
}

function whyItMatters(cluster,market,security,escalation,dependencies){
  const parts=[];
  const material=cluster.records[0]?.materiality;
  if(material?.nearestNode)parts.push(`The development is linked to ${material.nearestNode.name}, an important location.`);
  else if(material?.nearestArea)parts.push(`The development is linked to ${material.nearestArea.name}, an important monitored area.`);
  if(market.rules.length)parts.push(market.rules[0].rationale);
  if(security.scenarios.length)parts.push(`It matches the ${security.scenarios[0].name} scenario.`);
  if(escalation.direction==='ESCALATING')parts.push('Multiple escalation indicators appear in the underlying reporting.');
  if(escalation.direction==='DE-ESCALATING')parts.push('The underlying reporting contains de-escalation indicators; implementation still needs verification.');
  if(dependencies.length)parts.push(`The strongest current supply/market link is ${dependencies[0].origin} → ${dependencies[0].destination}: ${dependencies[0].flow}.`);
  if(!parts.length)parts.push('The development passed the selected region, source-quality, freshness and materiality filters.');
  return parts.join(' ');
}

function verification(c,p,lead){
  const notes=[];
  notes.push(`${c.independentSources} distinct source domain${c.independentSources===1?'':'s'} in the evidence set.`);
  if(c.officialPrimary)notes.push('At least one primary/official source is present.');
  if(c.stateOnly)notes.push('Warning: evidence is dominated by state-controlled or official claims and requires independent corroboration.');
  if(c.claimNeedsCorroboration&&c.independentSources<2)notes.push(`Claim-risk penalty ${c.claimPenalty}: high-consequence wording is not yet independently corroborated.`);
  if(lead?.classification?.eventType)notes.push(`Event taxonomy match: ${lead.classification.eventType.name}.`);
  if(p.length)notes.push('A related prediction market is shown as market sentiment, not as factual confirmation.');
  return notes;
}

function compactInstitution(x){return {id:x.id,name:x.name,kind:x.kind,priority:x.priority,whyItMatters:x.whyItMatters,highValueSignals:x.highValueSignals,matchScore:x.matchScore};}
function compactExposure(x){return {id:x.id,name:x.name,kind:x.kind,symbols:x.symbols,relevance:x.relevance,drivers:x.driverHits,upsideConditions:x.upsideConditions,downsideConditions:x.downsideConditions,horizons:x.horizons,notes:x.notes};}
function compactPlaybook(x){return {id:x.id,name:x.name,phase:x.phase,matchScore:x.matchScore,confirmationSignals:x.confirmationSignals,invalidationSignals:x.invalidationSignals,decisionQuestions:x.decisionQuestions,practicalChecks:x.practicalChecks};}
function compactDependency(x){return {id:x.id,origin:x.origin,destination:x.destination,flow:x.flow,relevance:x.relevance,failureModes:x.failureModes,substitutes:x.substitutes,monitorIndicators:x.monitorIndicators,typicalTransmissionLag:x.typicalTransmissionLag};}
