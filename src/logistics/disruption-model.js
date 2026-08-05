import { combineRiskComponents, normalizeRisk } from './risk-band.js';
import { weatherImpact } from './weather-model.js';
import { securityImpact } from './security-model.js';
import { sanctionsImpact } from './sanctions-model.js';
import { infrastructureImpact } from './infrastructure-model.js';
import { portCongestionScore } from './port-congestion.js';
export function disruptionAssessment(input = {}) {
  const weather = weatherImpact(input.weather || {}); const security = securityImpact(input.security || {});
  const sanctions = sanctionsImpact(input.sanctions || {}); const infrastructure = infrastructureImpact(input.infrastructure || {});
  const congestion = portCongestionScore(input.congestion || {});
  const event = Number(input.eventRisk || 0); const operational = Number(input.operationalRisk || 0);
  const combined = combineRiskComponents({ weather: weather.score, security: security.score, sanctions: sanctions.score, infrastructure: infrastructure.score, congestion: congestion.score, event, operational }, { weather: 0.12, security: 0.22, sanctions: 0.16, infrastructure: 0.15, congestion: 0.15, event: 0.12, operational: 0.08 });
  const blocked = sanctions.blocked || infrastructure.closed || congestion.closed;
  const risk = blocked ? normalizeRisk(Math.max(80, combined.score), combined.confidence, combined.components) : combined;
  return Object.freeze({ risk, weather, security, sanctions, infrastructure, congestion, blocked, assessedAt: new Date().toISOString() });
}
