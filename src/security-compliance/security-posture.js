import { average, clamp } from './utilities.js';

export function securityPosture(input = {}) {
  const compliance = Number(input.complianceScore || 0);
  const access = Number(input.accessScore ?? 70);
  const vulnerability = Number(input.vulnerabilityScore ?? 70);
  const incident = Number(input.incidentReadiness ?? 70);
  const data = Number(input.dataGovernanceScore ?? 70);
  const vendor = Number(input.vendorScore ?? 70);
  const score = Math.round(clamp(average([compliance, access, vulnerability, incident, data, vendor])));
  const critical = Number(input.openCriticalFindings || 0) + Number(input.criticalVulnerabilities || 0);
  const adjusted = clamp(score - critical * 5);
  return Object.freeze({
    score: adjusted,
    components: Object.freeze({ compliance, access, vulnerability, incident, data, vendor }),
    criticalIssues: critical,
    band: adjusted >= 85 ? 'STRONG' : adjusted >= 70 ? 'MANAGED' : adjusted >= 50 ? 'DEVELOPING' : 'EXPOSED'
  });
}
