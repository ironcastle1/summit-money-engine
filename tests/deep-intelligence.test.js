import test from 'node:test';
import assert from 'node:assert/strict';
import { matchEventTypes } from '../src/intel/event-taxonomy.js';
import { assessClaimRisk } from '../src/intel/claim-risk.js';
import { linkInstitutions } from '../src/intel/institution-linker.js';
import { assessEscalation } from '../src/intel/escalation-analysis.js';
import { mapExposures } from '../src/intel/exposure-engine.js';
import { matchPlaybooks } from '../src/intel/playbook-matcher.js';
import { affectedDependencies } from '../src/intel/dependency-impact.js';
import { sourceDiversity } from '../src/intel/source-diversity.js';
import { buildDecisionSummary } from '../src/intel/decision-summary.js';
import { planFollowUps } from '../src/intel/follow-up-planner.js';
import { locate } from '../src/intel/geography.js';
import { fixtureResults } from '../src/sources/fixture.js';
import { runIntelligencePipeline } from '../src/intel/pipeline.js';
import { COUNTRY_PRIORITY_BY_CODE } from '../src/catalog/country-priority-profiles.js';

function cluster(text,region='middle-east',location={name:'Strait of Hormuz',lat:26.56,lon:56.25}){
  return {
    primary:'conflict',
    regionIds:new Set([region,'world']),
    location,
    records:[{
      title:text,
      summary:text,
      materiality:{
        nearestNode:{id:'hormuz',name:'Strait of Hormuz'},
        nearestArea:null
      }
    }]
  };
}

test('event taxonomy identifies a commercial vessel attack',()=>{
  const rows=matchEventTypes({title:'Merchant ship attacked by missile in the Red Sea'});
  assert.equal(rows[0].name,'Commercial ship attacked');
  assert.ok(rows[0].weight>=20);
});

test('event taxonomy identifies capital controls as financial stability event',()=>{
  const rows=matchEventTypes({title:'Authorities announce capital controls and withdrawal limits'});
  assert.ok(rows.some(x=>x.name==='Capital controls'));
});

test('claim-risk engine penalises anonymous imminent-action claims',()=>{
  const risk=assessClaimRisk({title:'Officials say attack imminent within hours'});
  assert.ok(risk.score>=20);
  assert.equal(risk.requiresCorroboration,true);
});

test('claim-risk engine recognises primary legal evidence as mitigating',()=>{
  const risk=assessClaimRisk({title:'Executive order signed and official journal published'});
  assert.equal(risk.requiresCorroboration,false);
  assert.equal(risk.score,0);
});

test('institution linker identifies Federal Reserve',()=>{
  const institutions=linkInstitutions([{title:'Federal Reserve FOMC rate decision',summary:''}]);
  assert.equal(institutions[0].id,'fed');
  assert.ok(institutions[0].priority>=99);
});

test('institution linker identifies IAEA in Iran nuclear context',()=>{
  const institutions=linkInstitutions([{title:'IAEA reports on Iran enrichment',summary:''}]);
  assert.equal(institutions[0].id,'iaea');
});

test('escalation engine recognises embassy evacuation and deployment',()=>{
  const result=assessEscalation(cluster('Embassy evacuation ordered as additional forces begin forward deployment'));
  assert.equal(result.direction,'ESCALATING');
  assert.ok(result.indicators.length>=2);
});

test('escalation engine can recognise operational de-escalation',()=>{
  const result=assessEscalation(cluster('Ceasefire agreement takes effect as direct talks resume and military hotline activated'));
  assert.equal(result.direction,'DE-ESCALATING');
});

test('exposure engine maps Hormuz to crude and freight',()=>{
  const c=cluster('Tanker attacked near Hormuz and shipping is disrupted');
  const exposures=mapExposures(c,{assets:['Brent'],potentialBeneficiaries:['tanker rates'],potentialLosers:[]});
  assert.ok(exposures.some(x=>x.id==='brent'));
  assert.ok(exposures.some(x=>x.id==='tanker'));
});

test('US-Iran cluster selects dedicated escalation playbook',()=>{
  const c=cluster('US strikes Iran after IRGC retaliation threatens Hormuz');
  const institutions=linkInstitutions(c.records);
  const escalation=assessEscalation(c);
  const books=matchPlaybooks(c,{institutions,escalation});
  assert.equal(books[0].id,'us-iran-war');
});

test('dependency engine links Hormuz to global oil supply',()=>{
  const c=cluster('Hormuz tanker traffic disrupted');
  const rows=affectedDependencies(c,{
    market:{assets:['Brent'],potentialBeneficiaries:['tanker rates'],potentialLosers:[]},
    exposures:[{id:'brent'},{id:'tanker'}]
  });
  assert.ok(rows.some(x=>x.id==='dep-001'));
});

test('source diversity discounts state-only evidence',()=>{
  const result=sourceDiversity([
    {sourceDomain:'state.example',sourceMode:'reporting',sourceAlignment:'state-controlled',sourceType:'state-media',sourceQuality:.72},
    {sourceDomain:'state2.example',sourceMode:'reporting',sourceAlignment:'state-controlled',sourceType:'state-media',sourceQuality:.70}
  ]);
  assert.equal(result.warning,'Evidence is entirely state-controlled or official-claim material.');
  assert.ok(result.score<50);
});

test('source diversity rewards independent plus primary evidence',()=>{
  const result=sourceDiversity([
    {sourceDomain:'reuters.com',sourceMode:'reporting',sourceAlignment:'independent',sourceType:'wire',sourceQuality:.98},
    {sourceDomain:'treasury.gov',sourceMode:'primary-claim',sourceAlignment:'primary-source',sourceType:'official',sourceQuality:1}
  ]);
  assert.ok(result.score>=50);
  assert.equal(result.primaryCount,1);
});

test('follow-up planner targets high-value under-corroborated signals',()=>{
  const rows=planFollowUps([{
    id:'a',
    title:'Iran forces threaten tanker traffic near Hormuz',
    signalScore:88,
    independentSources:1,
    officialPrimary:false,
    category:'shipping',
    regionIds:['middle-east','world'],
    strategicNode:{name:'Strait of Hormuz'}
  }],{max:5,minScore:72});
  assert.equal(rows.length,1);
  assert.match(rows[0].query,/Hormuz/i);
});

test('follow-up planner avoids unnecessary queries after strong corroboration',()=>{
  const rows=planFollowUps([{
    id:'a',
    title:'Confirmed event',
    signalScore:90,
    independentSources:4,
    officialPrimary:true,
    category:'conflict',
    regionIds:['europe','world']
  }]);
  assert.equal(rows.length,0);
});

test('strategic-area geocoder recognises Natanz',()=>{
  const location=locate({title:'IAEA inspectors return to Natanz nuclear site'});
  assert.equal(location.name,'Natanz');
  assert.equal(location.countryCode,'IR');
});

test('priority-country profiles weight the requested core states strongly',()=>{
  for(const code of ['US','IR','RU','CN','TW']){
    assert.ok(COUNTRY_PRIORITY_BY_CODE.get(code).priority>=100);
  }
});

test('fixture pipeline exposes deep intelligence context',()=>{
  const fixture=fixtureResults();
  const pipeline=runIntelligencePipeline({
    rawItems:fixture.items,
    markets:fixture.markets,
    predictions:fixture.predictions
  });
  const iran=pipeline.signals.find(x=>/Iran-linked shipping|US military adjusts Gulf posture|Persian Gulf and Hormuz/.test(x.title));
  assert.ok(iran);
  assert.ok(iran.intelligence.playbooks.length>=1);
  assert.ok(iran.intelligence.exposures.length>=1);
  assert.ok(iran.intelligence.dependencies.length>=1);
});

test('decision summary concentrates exposures instead of adding unrelated dashboards',()=>{
  const fixture=fixtureResults();
  const pipeline=runIntelligencePipeline({
    rawItems:fixture.items,
    markets:fixture.markets,
    predictions:fixture.predictions
  });
  const summary=buildDecisionSummary(pipeline.signals);
  assert.ok(summary.highestSignal);
  assert.ok(summary.concentratedExposures.length>=1);
  assert.ok(summary.stressedDependencies.length>=1);
});

test('pipeline provides a change state for every current signal',()=>{
  const fixture=fixtureResults();
  const pipeline=runIntelligencePipeline({
    rawItems:fixture.items,
    markets:fixture.markets,
    predictions:fixture.predictions,
    previousSignals:[]
  });
  assert.ok(pipeline.signals.every(x=>x.change?.state==='NEW'));
});
