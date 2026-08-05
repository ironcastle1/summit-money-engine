import { BRIEFING_SECTIONS, REPORT_FORMATS } from './constants.js';
import { DEFAULT_ESCALATION_POLICIES } from './escalation-policy.js';
import { CLASSIFICATIONS } from './distribution-policy.js';
import { APPROVAL_STATES } from './approval-workflow.js';
import { SLA_STATES } from './sla-tracker.js';

export function decisionSupportCatalog() {
  return Object.freeze({
    version: '20.12.0',
    workspace: 'BRIEFINGS',
    sections: BRIEFING_SECTIONS,
    reports: REPORT_FORMATS,
    capabilities: Object.freeze([
      'EXECUTIVE_DASHBOARD',
      'MORNING_BRIEF',
      'SHIFT_HANDOVER',
      'WATCHLISTS',
      'SAVED_VIEWS',
      'WORKSPACES',
      'CASE_FILES',
      'EVIDENCE_LEDGER',
      'NOTES',
      'TASKS',
      'DECISION_REGISTER',
      'REPORTS',
      'EXPORTS',
      'MAP_FOCUS',
      'ESCALATION_POLICIES',
      'SLA_TRACKING',
      'BRIEFING_SCHEDULES',
      'APPROVAL_WORKFLOWS',
      'DISTRIBUTION_CONTROLS',
      'TAMPER_EVIDENT_AUDIT'
    ]),
    escalationPolicies: DEFAULT_ESCALATION_POLICIES,
    classifications: CLASSIFICATIONS,
    approvalStates: APPROVAL_STATES,
    slaStates: SLA_STATES,
    sourcePolicy: Object.freeze({
      measured: 'Direct source record',
      corroborated: 'Independent support',
      inferred: 'Derived and labelled',
      reference: 'Static catalogue or official baseline',
      unavailable: 'Never replaced with invented data'
    })
  });
}
