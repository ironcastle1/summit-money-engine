export function installMapSearchToggle(options = {}) { const root = options.root || document.querySelector('.map-search'); const toggle = options.toggle || document.getElementById('map-search-toggle'); const input = options.input || document.getElementById('global-search'); if (!root || !toggle || !input)
    return { destroy() { } }; const setOpen = open => { root.classList.toggle('open', open); toggle.setAttribute('aria-expanded', String(open)); input.tabIndex = open ? 0 : -1; if (open)
    requestAnimationFrame(() => input.focus());
else {
    input.blur();
    document.getElementById('search-results')?.classList.add('hidden');
} }; const onToggle = () => setOpen(!root.classList.contains('open')); const onKey = event => { if (event.key === '/' && !['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) {
    event.preventDefault();
    setOpen(true);
} if (event.key === 'Escape' && root.classList.contains('open'))
    setOpen(false); }; toggle.addEventListener('click', onToggle); document.addEventListener('keydown', onKey); setOpen(false); return { setOpen, destroy() { toggle.removeEventListener('click', onToggle); document.removeEventListener('keydown', onKey); } }; }
