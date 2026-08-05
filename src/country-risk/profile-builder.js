import {
  assessConflictExposure
}
from './conflict-exposure.js';
import {
  assessGovernanceScore
}
from './governance-score.js';
import {
  assessPoliticalStability
}
from './political-stability.js';
import {
  assessElectionRisk
}
from './election-risk.js';
import {
  assessSanctionsExposure
}
from './sanctions-exposure.js';
import {
  assessPolicyVolatility
}
from './policy-volatility.js';
import {
  assessSovereignRisk
}
from './sovereign-risk.js';
import {
  assessRegulatoryRisk
}
from './regulatory-risk.js';
import {
  assessHumanitarianPressure
}
from './humanitarian-pressure.js';
import {
  assessInstitutionalStrength
}
from './institutional-strength.js';
import {
  assessBorderRisk
}
from './border-risk.js';
import {
  assessCyberPolicyRisk
}
from './cyber-policy-risk.js';
import {
  assessTradeDependency
}
from './trade-dependency.js';
import {
  assessCurrencyStress
}
from './currency-stress.js';
import {
  assessFiscalStress
}
from './fiscal-stress.js';
import {
  assessProtestPressure
}
from './protest-pressure.js';
import {
  compositeCountryRisk
}
from './composite-risk.js';
import {
  buildCountryTimeline
}
from './timeline-builder.js';
import {
  buildCountryBriefing
}
from './briefing-builder.js';
function indicatorMap(detail={
}){
  const values=detail.indicators?.indicators||detail.indicators||{
  };
  return Object.fromEntries(Object.entries(values).map(([key,value])=>[key,Number(value?.value??value)]));
}
export function buildCountryRiskProfile(input={
}){
  const country=input.country||{
  };
  const events=input.events||[];
  const indicators={
    ...indicatorMap(input),
    ...(input.indicators||{
    })
  };
  const shared={
    ...input,
    ...indicators,
    events,
    evidence:input.evidence||[]
  };
  const factors={
    conflict:assessConflictExposure(shared),
    governance:assessGovernanceScore(shared),
    stability:assessPoliticalStability({
      ...shared,eventPressure:input.metrics?.composite?.score
    }),
    elections:assessElectionRisk({
      ...shared,elections:input.elections||input.electionData?.elections||[]
    }),
    sanctions:assessSanctionsExposure(shared),
    policy:assessPolicyVolatility(shared),
    sovereign:assessSovereignRisk(shared),
    regulatory:assessRegulatoryRisk(shared),
    humanitarian:assessHumanitarianPressure(shared),
    institutional:assessInstitutionalStrength(shared),
    border:assessBorderRisk(shared),
    cyber:assessCyberPolicyRisk(shared),
    trade:assessTradeDependency(shared),
    currency:assessCurrencyStress(shared),
    fiscal:assessFiscalStress(shared),
    protests:assessProtestPressure(shared)
  };
  const risk=compositeCountryRisk(factors);
  const timeline=buildCountryTimeline({
    events,policyEvents:input.policyEvents,elections:input.elections||input.electionData?.elections
  });
  const profile={
    country,
    factors:Object.freeze(factors),
    risk,
    timeline,
    sources:input.sources||{
    },
    generatedAt:new Date().toISOString()
  };
  return Object.freeze({
    ...profile,briefing:buildCountryBriefing(profile)
  });
}
