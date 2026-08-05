const SELECTOR = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

export function createFocusTrap(container, options = {}) {
  let active = false;
  let previous = null;
  const focusables = () => [...container.querySelectorAll(SELECTOR)].filter(element => !element.hidden && element.offsetParent !== null);
  const onKeydown = event => {
    if (!active) return;
    if (event.key === 'Escape' && options.escape !== false) {
      event.preventDefault();
      options.onEscape?.();
      return;
    }
    if (event.key !== 'Tab') return;
    const items = focusables();
    if (!items.length) {
      event.preventDefault();
      container.focus();
      return;
    }
    const first = items[0];
    const last = items.at(-1);
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };
  return Object.freeze({
    activate() {
      if (active) return;
      active = true;
      previous = document.activeElement;
      container.addEventListener('keydown', onKeydown);
      requestAnimationFrame(() => (focusables()[0] || container).focus());
    },
    deactivate() {
      if (!active) return;
      active = false;
      container.removeEventListener('keydown', onKeydown);
      if (options.restoreFocus !== false && previous?.isConnected) previous.focus();
    }
  });
}
