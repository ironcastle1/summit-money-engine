export function goLiveReport(input = {}) { const sections = { candidate: input.candidate || null, readiness: input.readiness || null, checklist: input.checklist || null, migrations: input.migrations || null, rollback: input.rollback || null, operations: input.operations || null, security: input.security || null, knownIssues: input.knownIssues || [] }; const blockers = []; if (!sections.readiness?.pass)
    blockers.push('READINESS_GATE'); if (!sections.checklist?.complete)
    blockers.push('DEPLOYMENT_CHECKLIST'); if (!sections.rollback?.ready)
    blockers.push('ROLLBACK_NOT_READY'); if (sections.knownIssues.some(item => item.severity === 'CRITICAL'))
    blockers.push('CRITICAL_KNOWN_ISSUE'); return Object.freeze({ generatedAt: new Date().toISOString(), decision: blockers.length ? 'NO_GO' : 'GO', blockers, sections }); }
