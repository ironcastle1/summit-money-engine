const editable = element => ['INPUT', 'TEXTAREA', 'SELECT'].includes(element?.tagName) || element?.isContentEditable;

export function installKeyboardShortcuts(actions = {}) {
  const handler = event => {
    if (editable(document.activeElement) && event.key !== 'Escape') return;
    if (event.key === '?' || (event.key === '/' && event.shiftKey)) {
      event.preventDefault();
      actions.openHelp?.();
    }
    if (event.altKey && /^[1-9]$/.test(event.key)) {
      event.preventDefault();
      actions.openNavigationIndex?.(Number(event.key) - 1);
    }
    if (event.key.toLowerCase() === 't' && event.altKey) {
      event.preventDefault();
      actions.cycleTheme?.();
    }
    if (event.key.toLowerCase() === 'm' && event.altKey) {
      event.preventDefault();
      document.querySelector('[data-view="map"]')?.click();
    }
    if (event.key === 'Escape') actions.escape?.();
  };
  document.addEventListener('keydown', handler);
  return () => document.removeEventListener('keydown', handler);
}
