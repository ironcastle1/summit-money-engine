const DEMO_NOTICE = 'DEMONSTRATION DATA — NOT A LIVE OPERATIONAL ASSESSMENT';

export function createDemoWorkspace(options = {}) {
  const now = options.now || new Date().toISOString();
  return Object.freeze({
    id: 'merlin-guided-demo',
    label: 'Guided product demonstration',
    notice: DEMO_NOTICE,
    generatedAt: now,
    sample: true,
    journeys: [
      { id: 'demo-risk', title: 'Assess a deteriorating shipping corridor', workspace: 'map', action: 'Open route exposure and compare alternatives.' },
      { id: 'demo-market', title: 'Connect a supply shock to market signals', workspace: 'markets', action: 'Inspect evidence, regime and sensitivity.' },
      { id: 'demo-brief', title: 'Produce an executive morning brief', workspace: 'briefings', action: 'Review priorities and export a classified summary.' },
      { id: 'demo-automation', title: 'Create a material-event alert', workspace: 'automation', action: 'Build a threshold rule with quiet hours and escalation.' }
    ],
    safeguards: Object.freeze({
      canSendNotifications: false,
      canCreateBillingActions: false,
      canRepresentLiveData: false,
      mustDisplayNotice: true
    })
  });
}

export function isDemoRequest(query = new URLSearchParams()) {
  return ['1', 'true', 'yes'].includes(String(query.get('demo') || '').toLowerCase());
}
