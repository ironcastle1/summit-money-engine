const STORAGE_KEY = 'summit.experience.preferences.v1';

export const SOUND_MODES = Object.freeze(['OFF', 'ALERTS', 'FULL']);
export const DENSITY_MODES = Object.freeze(['COMFORTABLE', 'COMPACT']);
export const MOTION_MODES = Object.freeze(['SYSTEM', 'FULL', 'REDUCED']);

export const DEFAULT_PREFERENCES = Object.freeze({
  soundMode: 'ALERTS',
  volume: 0.28,
  motionMode: 'SYSTEM',
  density: 'COMFORTABLE',
  ambientGlow: true,
  cursorLight: true,
  metricAnimation: true
});

function clamp(value, minimum, maximum) {
  const number = Number(value);
  if (!Number.isFinite(number)) return minimum;
  return Math.min(maximum, Math.max(minimum, number));
}

function oneOf(value, choices, fallback) {
  return choices.includes(String(value).toUpperCase()) ? String(value).toUpperCase() : fallback;
}

export function normalizePreferences(input = {}) {
  return {
    soundMode: oneOf(input.soundMode, SOUND_MODES, DEFAULT_PREFERENCES.soundMode),
    volume: clamp(input.volume ?? DEFAULT_PREFERENCES.volume, 0, 1),
    motionMode: oneOf(input.motionMode, MOTION_MODES, DEFAULT_PREFERENCES.motionMode),
    density: oneOf(input.density, DENSITY_MODES, DEFAULT_PREFERENCES.density),
    ambientGlow: input.ambientGlow !== false,
    cursorLight: input.cursorLight !== false,
    metricAnimation: input.metricAnimation !== false
  };
}

export function loadPreferences(storage = globalThis.localStorage) {
  if (!storage?.getItem) return { ...DEFAULT_PREFERENCES };
  try {
    const value = storage.getItem(STORAGE_KEY);
    return value ? normalizePreferences(JSON.parse(value)) : { ...DEFAULT_PREFERENCES };
  } catch {
    return { ...DEFAULT_PREFERENCES };
  }
}

export function savePreferences(preferences, storage = globalThis.localStorage) {
  const normalized = normalizePreferences(preferences);
  if (storage?.setItem) {
    try { storage.setItem(STORAGE_KEY, JSON.stringify(normalized)); } catch {}
  }
  return normalized;
}

export function cycleSoundMode(mode) {
  const index = SOUND_MODES.indexOf(oneOf(mode, SOUND_MODES, DEFAULT_PREFERENCES.soundMode));
  return SOUND_MODES[(index + 1) % SOUND_MODES.length];
}

export function effectiveMotionMode(preferences, media = globalThis.matchMedia) {
  const normalized = normalizePreferences(preferences);
  if (normalized.motionMode !== 'SYSTEM') return normalized.motionMode;
  try { return media?.('(prefers-reduced-motion: reduce)')?.matches ? 'REDUCED' : 'FULL'; }
  catch { return 'FULL'; }
}

export function preferenceStorageKey() { return STORAGE_KEY; }
