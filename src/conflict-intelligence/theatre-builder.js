import {
  THEATRE_WEIGHTS
}
from './constants.js';
import {
  weightedMean,
  round
}
from './numbers.js';
import {
  theatreKey,
  theatreLabel
}
from './theatre-key.js';
import {
  conflictIntensity
}
from './intensity-score.js';
import {
  escalationScore
}
from './escalation-score.js';
import {
  escalationLadder
}
from './escalation-ladder.js';
import {
  conflictPhase
}
from './conflict-phase.js';
import {
  buildActorGraph
}
from './actor-graph.js';
import {
  inferAllianceNetwork
}
from './alliance-network.js';
import {
  buildFrontlines
}
from './frontline-builder.js';
import {
  analyzeStrikes
}
from './strike-analysis.js';
import {
  forcePosture
}
from './force-posture.js';
import {
  territorialControl
}
from './territorial-control.js';
import {
  ceasefireStatus
}
from './ceasefire-monitor.js';
import {
  assessCeasefireViolations
}
from './ceasefire-violation.js';
import {
  civilianExposure
}
from './civilian-exposure.js';
import {
  infrastructureExposure
}
from './infrastructure-exposure.js';
import {
  humanitarianSpillover
}
from './humanitarian-spillover.js';
import {
  displacementPressure
}
from './displacement-pressure.js';
import {
  logisticsExposure
}
from './logistics-exposure.js';
import {
  economicExposure
}
from './economic-exposure.js';
import {
  energyExposure
}
from './energy-exposure.js';
import {
  foodExposure
}
from './food-exposure.js';
import {
  crossBorderRisk
}
from './cross-border-risk.js';
import {
  regionalContagion
}
from './regional-contagion.js';
import {
  verificationGap
}
from './verification-gap.js';
import {
  conflictContradictions
}
from './contradiction-analysis.js';
import {
  manipulationRisk
}
from './manipulation-risk.js';
import {
  theatreConfidence
}
from './confidence-score.js';
import {
  conflictTimeline
}
from './timeline-builder.js';
export function buildTheatre(events = [],
options = {
}) {
  if (!events.length)
  return null;
  const intensity = conflictIntensity(events,
  options.now),
  escalation = escalationScore(events),
  actors = buildActorGraph(events),
  civilian = civilianExposure(events),
  infrastructure = infrastructureExposure(events),
  humanitarian = humanitarianSpillover(events),
  displacement = displacementPressure(events),
  logistics = logisticsExposure(events),
  economic = economicExposure(events),
  energy = energyExposure(events),
  food = foodExposure(events),
  crossBorder = crossBorderRisk(events),
  regional = regionalContagion(events),
  verification = verificationGap(events),
  contradictions = conflictContradictions(events),
  manipulation = manipulationRisk(events,
  contradictions),
  confidence = theatreConfidence(events,
  verification,
  contradictions),
  ceasefire = ceasefireStatus(events,
  options.now),
  risk = weightedMean([{
    value: intensity.score,
    weight: THEATRE_WEIGHTS.intensity
  },
  {
    value: escalation.score,
    weight: THEATRE_WEIGHTS.escalation
  },
  {
    value: civilian.score,
    weight: THEATRE_WEIGHTS.civilian
  },
  {
    value: infrastructure.score,
    weight: THEATRE_WEIGHTS.infrastructure
  },
  {
    value: humanitarian.score,
    weight: THEATRE_WEIGHTS.humanitarian
  },
  {
    value: regional.score,
    weight: THEATRE_WEIGHTS.regional
  },
  {
    value: logistics.score,
    weight: THEATRE_WEIGHTS.logistics
  },
  {
    value: economic.score,
    weight: THEATRE_WEIGHTS.economic
  }]);
  const center = {
    lat: round(events.reduce((s,
    e) => s + e.lat,
    0) / events.length,
    4),
    lon: round(events.reduce((s,
    e) => s + e.lon,
    0) / events.length,
    4)
  };
  return Object.freeze({
    id: theatreKey(events[0]),
    name: theatreLabel(events),
    country: events[0].country,
    region: events[0].region,
    center,
    eventCount: events.length,
    risk: Object.freeze({
      score: round(risk,
      1),
      band: risk >= 80 ? 'EXTREME' : risk >= 65 ? 'CRITICAL' : risk >= 45 ? 'SERIOUS' : risk >= 25 ? 'ELEVATED' : 'ROUTINE'
    }),
    phase: conflictPhase({
      events,
      intensity,
      escalation,
      trend: options.trend
    }),
    intensity,
    escalation: Object.freeze({
      ...escalation,
      ladder: escalationLadder(escalation.score,
      escalation.indicators)
    }),
    confidence,
    actors,
    alliances: inferAllianceNetwork(actors,
    events),
    forcePosture: forcePosture(actors,
    events),
    fronts: buildFrontlines(events),
    strikes: analyzeStrikes(events),
    territorialControl: territorialControl(events),
    ceasefire: Object.freeze({
      ...ceasefire,
      assessment: assessCeasefireViolations(ceasefire)
    }),
    exposure: Object.freeze({
      civilian,
      infrastructure,
      humanitarian,
      displacement,
      logistics,
      economic,
      energy,
      food,
      crossBorder,
      regional
    }),
    verification,
    contradictions,
    manipulation,
    timeline: conflictTimeline(events),
    latestEvent: conflictTimeline(events,
    1)[0] || null,
    generatedAt: new Date(options.now || Date.now()).toISOString()
  });
}
