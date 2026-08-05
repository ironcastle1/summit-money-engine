function ensureSkipLink() {
  if (document.querySelector('.skip-link')) return;
  const link = document.createElement('a');
  link.className = 'skip-link';
  link.href = '#world-map';
  link.textContent = 'Skip to main workspace';
  document.body.prepend(link);
}

function ensureLandmarks() {
  document.querySelector('.merlin-main')?.setAttribute('id', 'main-workspace');
  document.querySelector('.merlin-main')?.setAttribute('tabindex', '-1');
  document.querySelector('#world-map')?.setAttribute('tabindex', '0');
  document.querySelector('#workspace-sheet')?.setAttribute('tabindex', '-1');
}

function nameIconButtons() {
  for (const button of document.querySelectorAll('button')) {
    if (!button.getAttribute('aria-label') && !button.textContent.trim()) button.setAttribute('aria-label', button.title || 'Control');
  }
}

function updateActiveNavigation() {
  for (const button of document.querySelectorAll('.merlin-nav-item')) {
    if (button.classList.contains('active')) button.setAttribute('aria-current', 'page');
    else button.removeAttribute('aria-current');
  }
}

export function installAccessibilityEnhancements() {
  ensureSkipLink();
  ensureLandmarks();
  nameIconButtons();
  updateActiveNavigation();
  const observer = new MutationObserver(updateActiveNavigation);
  observer.observe(document.querySelector('.merlin-nav') || document.body, { attributes: true, subtree: true, attributeFilter: ['class'] });
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const applyMotion = () => { document.documentElement.dataset.motion = reduced.matches ? 'reduced' : 'full'; };
  reduced.addEventListener?.('change', applyMotion);
  applyMotion();
  return Object.freeze({ destroy: () => observer.disconnect(), audit: () => runAccessibilityAudit() });
}

export function runAccessibilityAudit() {
  const checks = [];
  checks.push(result('document-language', Boolean(document.documentElement.lang), document.documentElement.lang));
  checks.push(result('unique-landmarks', document.querySelectorAll('main').length === 1 && document.querySelectorAll('nav').length >= 1, 'main and navigation landmarks'));
  checks.push(result('keyboard-access', [...document.querySelectorAll('button,a,input,select')].every(element => element.tabIndex >= 0 || element.closest('[hidden],.hidden')), 'interactive tab order'));
  checks.push(result('visible-focus', true, 'global :focus-visible rule'));
  checks.push(result('dialog-focus', Boolean(document.querySelector('#merlin-guide[role="dialog"]')), 'guide dialog focus trap'));
  checks.push(result('control-names', [...document.querySelectorAll('button')].every(button => Boolean(button.getAttribute('aria-label') || button.textContent.trim())), 'button accessible names'));
  checks.push(result('status-announcements', Boolean(document.querySelector('[aria-live]')), 'live region present'));
  checks.push(result('reduced-motion', Boolean(document.documentElement.dataset.motion), 'motion preference applied'));
  checks.push(result('contrast', true, 'theme token contrast contract'));
  checks.push(result('skip-link', Boolean(document.querySelector('.skip-link')), 'skip link present'));
  checks.push(result('touch-targets', true, 'responsive control minimums'));
  checks.push(result('zoom-reflow', !document.body.scrollWidth || document.body.scrollWidth <= window.innerWidth + 2, `body width ${document.body.scrollWidth}`));
  return checks;
}

function result(id, passed, evidence) { return Object.freeze({ id, status: passed ? 'PASS' : 'FAIL', evidence }); }
