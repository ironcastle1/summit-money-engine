import {
  clamp,
  round
}
from './numbers.js';
import {
  ESCALATION_LEVELS
}
from './constants.js';
import {
  escalationIndicators
}
from './escalation-indicators.js';
export function escalationScore(events = []) {
  const indicators = escalationIndicators(events),
  score = clamp(indicators.crossBorder * 8 + indicators.strategicWeapons * 11 + indicators.civilianTargets * 5 + indicators.mobilization * 6 + indicators.territorialChange * 9 + indicators.ceasefireViolations * 10 + indicators.airAndMissile * 3 + indicators.infrastructureHits * 2 + indicators.highFatality * 6);
  const level = ESCALATION_LEVELS.find(item => score >= item.minimum && score <= item.maximum) || ESCALATION_LEVELS.at(-1);
  return Object.freeze({
    score: round(score,
    1),
    level: level.id,
    label: level.label,
    indicators
  });
}
