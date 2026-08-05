export function createResponsiveNavigation(options = {}) {
  const nav = options.nav || document.querySelector('.merlin-nav');
  const toggle = options.toggle || document.querySelector('#mobile-nav-toggle');
  const root = options.root || document.documentElement;
  if (!nav || !toggle) return Object.freeze({ close() {}, open() {}, isOpen: () => false });
  let open = false;
  const render = () => {
    root.dataset.mobileNav = open ? 'open' : 'closed';
    toggle.setAttribute('aria-expanded', String(open));
    nav.setAttribute('aria-hidden', String(!open && matchMedia('(max-width: 860px)').matches));
  };
  const close = () => { open = false; render(); };
  const show = () => { open = true; render(); nav.querySelector('button')?.focus(); };
  toggle.addEventListener('click', () => open ? close() : show());
  nav.addEventListener('click', event => { if (event.target.closest('.merlin-nav-item')) close(); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && open) close(); });
  matchMedia('(max-width: 860px)').addEventListener?.('change', event => { if (!event.matches) close(); else render(); });
  render();
  return Object.freeze({ close, open: show, isOpen: () => open });
}
