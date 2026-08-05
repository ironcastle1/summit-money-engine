import {
  CONFLICT_SCENARIOS
}
from './scenario-catalog.js';
import {
  clamp,
  round
}
from './numbers.js';
export function runConflictScenario(theatre,
input = {
}) {
  const scenario = CONFLICT_SCENARIOS.find(item => item.id === String(input.type || input.scenarioId).toUpperCase());
  if (!scenario)
  throw Object.assign(new Error('Unknown conflict scenario'),
  {
    code: 'VALIDATION_ERROR',
    statusCode: 400
  });
  const severity = clamp(input.severity ?? 50) / 100,
  horizonDays = Math.max(1,
  Math.min(365,
  Number(input.horizonDays) || 30)),
  decay = Math.exp(-horizonDays / 540),
  effects = Object.fromEntries(Object.entries(scenario.effects).map(([key,
  value]) => [key,
  round(value * severity * decay,
  1)])),
  before = theatre.risk.score,
  delta = round(Object.values(effects).reduce((s,
  v) => s + v,
  0) / Math.max(1,
  Object.values(effects).length),
  1),
  after = round(clamp(before + delta),
  1);
  return Object.freeze({
    theatreId: theatre.id,
    scenario: scenario.id,
    label: scenario.label,
    severity: round(severity * 100,
    1),
    horizonDays,
    before,
    after,
    delta: round(after - before,
    1),
    effects,
    generatedAt: new Date().toISOString()
  });
}
