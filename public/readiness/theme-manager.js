import { savePreferences } from './preferences.js';

export const THEMES = Object.freeze(['midnight', 'graphite', 'forest', 'crimson', 'sand', 'light']);

export function createThemeManager(options = {}) {
  const root = options.root || document.documentElement;
  const select = options.select || document.querySelector('#theme-select');
  function apply(theme, persist = true) {
    const chosen = THEMES.includes(theme) ? theme : 'midnight';
    root.dataset.theme = chosen;
    root.style.colorScheme = ['sand', 'light'].includes(chosen) ? 'light' : 'dark';
    if (select) select.value = chosen;
    if (persist) savePreferences({ theme: chosen });
    window.dispatchEvent(new CustomEvent('merlin:theme', { detail: { theme: chosen } }));
    return chosen;
  }
  select?.addEventListener('change', event => apply(event.target.value));
  return Object.freeze({ apply, current: () => root.dataset.theme || 'midnight' });
}
