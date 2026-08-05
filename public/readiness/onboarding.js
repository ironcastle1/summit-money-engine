import { createFocusTrap } from './focus-trap.js';
import { savePreferences } from './preferences.js';

const STEPS = Object.freeze([
  { title: 'One operating picture', body: 'Use the map to combine material events, political risk, hazards, logistics and market context.', target: '.map-stage' },
  { title: 'Search without losing the map', body: 'Open the magnifying glass to search cities, countries, ports and coordinates.', target: '#map-search-toggle' },
  { title: 'Control intelligence layers', body: 'Keep only the overlays relevant to the decision you are making.', target: '#layer-dock' },
  { title: 'Find actionable consequences', body: 'Opportunities rank the likely commercial and operational implications of events.', target: '[data-view="opportunities"]' },
  { title: 'Begin with the morning brief', body: 'Briefings summarise overnight change, priorities, evidence and unresolved gaps.', target: '[data-view="briefings"]' },
  { title: 'Automate repeated checking', body: 'Build rules for countries, routes, markets and hazards and let Merlin create alerts or reports.', target: '[data-view="automation"]' }
]);

export function createOnboarding(options = {}) {
  const dialog = options.dialog || createDialog();
  const trap = createFocusTrap(dialog, { onEscape: () => close() });
  let index = 0;
  let open = false;
  const title = dialog.querySelector('[data-guide-title]');
  const body = dialog.querySelector('[data-guide-body]');
  const progress = dialog.querySelector('[data-guide-progress]');
  const next = dialog.querySelector('[data-guide-next]');
  const previous = dialog.querySelector('[data-guide-previous]');

  function render() {
    const step = STEPS[index];
    title.textContent = step.title;
    body.textContent = step.body;
    progress.textContent = `${index + 1} / ${STEPS.length}`;
    previous.disabled = index === 0;
    next.textContent = index === STEPS.length - 1 ? 'FINISH' : 'NEXT';
    document.querySelectorAll('.guide-target').forEach(element => element.classList.remove('guide-target'));
    document.querySelector(step.target)?.classList.add('guide-target');
  }
  function show(start = 0) {
    index = Math.max(0, Math.min(STEPS.length - 1, start));
    open = true;
    dialog.hidden = false;
    dialog.setAttribute('aria-hidden', 'false');
    render();
    trap.activate();
  }
  function close(completed = false) {
    open = false;
    dialog.hidden = true;
    dialog.setAttribute('aria-hidden', 'true');
    document.querySelectorAll('.guide-target').forEach(element => element.classList.remove('guide-target'));
    trap.deactivate();
    if (completed) savePreferences({ onboardingComplete: true });
    options.onClose?.({ completed });
  }
  next.addEventListener('click', () => index < STEPS.length - 1 ? (index += 1, render()) : close(true));
  previous.addEventListener('click', () => { index = Math.max(0, index - 1); render(); });
  dialog.querySelector('[data-guide-skip]').addEventListener('click', () => close(false));
  return Object.freeze({ show, close, isOpen: () => open, steps: STEPS });
}

function createDialog() {
  const dialog = document.createElement('section');
  dialog.id = 'merlin-guide';
  dialog.className = 'merlin-guide';
  dialog.hidden = true;
  dialog.tabIndex = -1;
  dialog.setAttribute('role', 'dialog');
  dialog.setAttribute('aria-modal', 'true');
  dialog.setAttribute('aria-hidden', 'true');
  dialog.setAttribute('aria-labelledby', 'merlin-guide-title');
  dialog.innerHTML = `<div class="guide-card"><header><span>MERLIN PRODUCT GUIDE</span><b data-guide-progress></b></header><h2 id="merlin-guide-title" data-guide-title></h2><p data-guide-body></p><footer><button type="button" data-guide-skip>SKIP</button><div><button type="button" data-guide-previous>BACK</button><button type="button" data-guide-next>NEXT</button></div></footer></div>`;
  document.body.append(dialog);
  return dialog;
}
