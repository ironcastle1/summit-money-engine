const KEY = 'merlin.market-readiness.preferences.v20';
const DEFAULTS = Object.freeze({ theme: 'midnight', onboardingComplete: false, reducedMotion: false, compactNavigation: false, demoMode: false });

export function loadPreferences() {
  try {
    const stored = JSON.parse(localStorage.getItem(KEY) || '{}');
    return { ...DEFAULTS, ...stored };
  } catch {
    return { ...DEFAULTS };
  }
}

export function savePreferences(patch) {
  const next = { ...loadPreferences(), ...patch };
  localStorage.setItem(KEY, JSON.stringify(next));
  return next;
}

export function resetPreferences() {
  localStorage.removeItem(KEY);
  return { ...DEFAULTS };
}
