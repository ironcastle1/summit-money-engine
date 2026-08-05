export const ONBOARDING_STEPS = Object.freeze([
  { id: 'welcome', title: 'Your global operating picture', target: '.merlin-brand', body: 'Merlin combines material events, markets, logistics and political risk in one map-first workspace.' },
  { id: 'search', title: 'Search anywhere', target: '#map-search-toggle', body: 'Open search to find a country, city, port or coordinate without covering the map.' },
  { id: 'layers', title: 'Control the map', target: '#layer-dock', body: 'Turn intelligence layers on and off, change the base map and keep only the signals relevant to your task.' },
  { id: 'timeline', title: 'Change the operating window', target: '.map-timeline', body: 'Limit the map to recent activity and adjust the radius used for local scans.' },
  { id: 'opportunities', title: 'Translate events into action', target: '[data-view="opportunities"]', body: 'Ranked opportunities connect events with markets, supply chains and next research actions.' },
  { id: 'briefings', title: 'Start each day here', target: '[data-view="briefings"]', body: 'The Briefings workspace consolidates overnight change, evidence gaps and priority decisions.' },
  { id: 'automation', title: 'Stop checking manually', target: '[data-view="automation"]', body: 'Create rules that monitor thresholds, routes, countries and hazards and produce tasks or reports.' },
  { id: 'finish', title: 'Merlin is ready', target: '#help-button', body: 'Reopen this guide at any time from the help button.' }
]);

export function buildOnboardingPlan(options = {}) {
  const completed = new Set(options.completed || []);
  return Object.freeze({
    version: '20.20.0',
    steps: ONBOARDING_STEPS.map((step, index) => Object.freeze({ ...step, index, completed: completed.has(step.id) })),
    completed: ONBOARDING_STEPS.every(step => completed.has(step.id)),
    progress: Math.round((ONBOARDING_STEPS.filter(step => completed.has(step.id)).length / ONBOARDING_STEPS.length) * 100)
  });
}
