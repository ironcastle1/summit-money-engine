import {
  normalizeHazardEvent
}
from './event-normalizer.js';
import {
  evaluateMateriality
}
from './materiality-policy.js';
import {
  populationExposure
}
from './population-exposure.js';
import {
  infrastructureExposure
}
from './infrastructure-exposure.js';
import {
  logisticsExposure
}
from './logistics-exposure.js';
import {
  economicImpact
}
from './economic-impact.js';
import {
  casualtyEstimate
}
from './casualty-model.js';
import {
  responsePriority
}
from './response-priority.js';
import {
  cascadingRisks
}
from './cascading-risk.js';
export function runHazardScenario(input= {
}, context= {
}) {
  const event=normalizeHazardEvent(input.event||input);
  if(!event)throw new Error('A valid scenario location is required');
  const materiality=evaluateMateriality(event, {
    minimumScore:0, maximumAgeHours:1e9, ...input.policy
  });
  const enriched= {
    ...event, materiality
  };
  const population=populationExposure(enriched, input.places||context.places||[], input);
  const infrastructure=infrastructureExposure(enriched, input.assets||context.assets||[], input);
  const logistics=logisticsExposure(enriched, input.logistics||context.logistics|| {
  }, input);
  const populationScore=Math.min(100, Math.log10(Math.max(1, population.estimatedPopulation))*12);
  const exposure= {
    population, populationScore, infrastructure, logistics
  };
  const economics=economicImpact(enriched, exposure, input.economics);
  const casualties=casualtyEstimate(enriched, population, input.casualties);
  const priority=responsePriority(enriched, exposure);
  return Object.freeze( {
    event:Object.freeze(enriched), exposure:Object.freeze(exposure), economics, casualties, priority, cascadingRisks:cascadingRisks(enriched, exposure), assumptions:Object.freeze( {
      catalogueBased:true, notAWeatherForecast:true, observed:false
    }), generatedAt:new Date().toISOString()
  });
}
