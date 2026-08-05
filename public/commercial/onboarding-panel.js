import { esc } from './format.js';
export function onboardingPanelHtml(analysis) { if (!analysis)
    return ''; return `<section class="commercial-card"><header><div><span>TIME TO VALUE</span><h2>Onboarding</h2></div><b>${analysis.onboarding.score}%</b></header><div class="onboarding-list">${analysis.onboarding.steps.map(step => `<button data-commercial-step="${esc(step.id)}" ${step.complete ? 'disabled' : ''}><i>${step.complete ? '✓' : '○'}</i><span><b>${esc(step.title)}</b><small>${step.weight}% of onboarding</small></span></button>`).join('')}</div></section>`; }
