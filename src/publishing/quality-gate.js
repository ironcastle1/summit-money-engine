import { approvalGate } from './approval-gate.js';
import { clamp, frozen } from './utilities.js';

export function publicationQualityGate(edition, input = {}) {
  const blockTypes = new Set((edition.blocks || []).map(block => block.type));
  const required = input.requiredBlockTypes || ['EXECUTIVE_SUMMARY', 'KEY_FINDINGS'];
  const missing = required.filter(type => !blockTypes.has(type));
  const sourceCount = new Set(edition.sourceIds || []).size;
  const approval = approvalGate({ required: input.approvalRequired !== false, approvals: edition.approval?.history || input.approvals || [], minimumApprovals: input.minimumApprovals || 1 });
  const score = clamp(100 - missing.length * 18 - (sourceCount ? 0 : 20) - (approval.passed ? 0 : 20));
  const failures = [];
  if (missing.length) failures.push(`MISSING_BLOCKS:${missing.join(',')}`);
  if (!sourceCount && input.requireSources !== false) failures.push('NO_SOURCES');
  if (!approval.passed) failures.push(...approval.reasons);
  return frozen({ passed: failures.length === 0, score, failures, missingBlocks: missing, sourceCount, approval });
}
