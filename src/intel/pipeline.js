import { normalizeRecords } from './normalize.js';
import { dedupe } from './dedupe.js';
import { cluster } from './clustering.js';
import { buildSignals } from './signals.js';
import { buildBriefing } from './briefing.js';
import { attachChangeState } from './change-detection.js';
import { buildDecisionSummary } from './decision-summary.js';
import { buildSourceCoverage } from './source-coverage.js';
import { buildWatchboard } from './watchboard.js';

export function runIntelligencePipeline({rawItems=[],markets=[],predictions=[],sourceStatuses=[],previousSignals=[],now=Date.now()}){
  const normalized=normalizeRecords(rawItems,{now});
  const unique=dedupe(normalized);
  const clusters=cluster(unique);
  const signals=attachChangeState(buildSignals(clusters,predictions),previousSignals);
  const briefing=buildBriefing(signals,markets,sourceStatuses);
  const decisionSummary=buildDecisionSummary(signals);
  const sourceCoverage=buildSourceCoverage(sourceStatuses);
  const watchboard=buildWatchboard(signals,markets,predictions,sourceCoverage);
  return {
    generatedAt:new Date(now).toISOString(),
    records:unique,
    signals,
    markets,
    predictions,
    briefing,
    decisionSummary,
    watchboard,
    sourceCoverage,
    sourceStatuses,
    metrics:{
      rawItems:rawItems.length,
      normalized:normalized.length,
      unique:unique.length,
      clusters:clusters.length,
      signals:signals.length,
      markets:markets.length,
      predictions:predictions.length
    }
  };
}
