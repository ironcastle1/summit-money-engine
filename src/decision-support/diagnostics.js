export function decisionSupportDiagnostics(platform) {
  return Object.freeze({
    service: 'decision-support',
    version: '20.12.0',
    status: 'READY',
    cacheEntries: platform.cache?.size || 0,
    cacheTtlMs: platform.cacheTtlMs,
    ownerBuckets: Object.freeze({
      workspaces: platform.workspaces?.owners?.size || 0,
      cases: platform.cases?.owners?.size || 0,
      activity: platform.activity?.activity?.size || 0,
      decisions: platform.decisions?.owners?.size || 0,
      slas: platform.slas?.owners?.size || 0,
      schedules: platform.schedules?.owners?.size || 0,
      approvals: platform.approvals?.owners?.size || 0,
      audit: platform.audit?.owners?.size || 0
    }),
    policies: Object.freeze({ escalation: platform.escalationPolicies?.length || 0 }),
    dependencies: Object.freeze({
      events: Boolean(platform.eventService),
      conflict: Boolean(platform.conflict),
      hazards: Boolean(platform.hazards),
      markets: Boolean(platform.markets),
      countries: Boolean(platform.countries),
      logistics: Boolean(platform.logistics),
      opportunities: Boolean(platform.opportunities)
    }),
    controls: Object.freeze({
      tamperEvidentAudit: true,
      approvalWorkflow: true,
      distributionPolicy: true,
      slaTracking: true,
      scheduledBriefings: true
    }),
    generatedAt: new Date().toISOString()
  });
}
