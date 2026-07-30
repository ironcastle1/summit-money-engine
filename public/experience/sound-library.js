export const SOUND_LIBRARY = Object.freeze({
  NAVIGATE: {
    mode: 'FULL',
    gain: 0.16,
    envelope: [0.004, 0.045, 0.06],
    voices: [
      { type: 'sine', frequency: 430, endFrequency: 540, delay: 0, duration: 0.085 },
      { type: 'triangle', frequency: 860, endFrequency: 760, delay: 0.012, duration: 0.07, gain: 0.35 }
    ]
  },
  INTERACT: {
    mode: 'FULL',
    gain: 0.10,
    envelope: [0.002, 0.025, 0.035],
    voices: [
      { type: 'sine', frequency: 680, endFrequency: 620, delay: 0, duration: 0.045 },
      { type: 'square', frequency: 1360, endFrequency: 1240, delay: 0, duration: 0.025, gain: 0.12 }
    ]
  },
  OPEN: {
    mode: 'FULL',
    gain: 0.14,
    envelope: [0.005, 0.08, 0.12],
    voices: [
      { type: 'sine', frequency: 260, endFrequency: 390, delay: 0, duration: 0.16 },
      { type: 'triangle', frequency: 520, endFrequency: 780, delay: 0.025, duration: 0.14, gain: 0.25 }
    ]
  },
  CLOSE: {
    mode: 'FULL',
    gain: 0.12,
    envelope: [0.003, 0.06, 0.10],
    voices: [
      { type: 'sine', frequency: 420, endFrequency: 280, delay: 0, duration: 0.12 },
      { type: 'triangle', frequency: 690, endFrequency: 460, delay: 0.015, duration: 0.10, gain: 0.22 }
    ]
  },
  SUCCESS: {
    mode: 'ALERTS',
    gain: 0.20,
    envelope: [0.008, 0.14, 0.22],
    voices: [
      { type: 'sine', frequency: 523.25, endFrequency: 523.25, delay: 0, duration: 0.17 },
      { type: 'sine', frequency: 659.25, endFrequency: 659.25, delay: 0.075, duration: 0.18 },
      { type: 'triangle', frequency: 783.99, endFrequency: 783.99, delay: 0.15, duration: 0.22, gain: 0.45 }
    ]
  },
  SCAN_COMPLETE: {
    mode: 'ALERTS',
    gain: 0.18,
    envelope: [0.006, 0.11, 0.18],
    voices: [
      { type: 'sine', frequency: 392, endFrequency: 440, delay: 0, duration: 0.16 },
      { type: 'sine', frequency: 523.25, endFrequency: 587.33, delay: 0.07, duration: 0.18 },
      { type: 'triangle', frequency: 783.99, endFrequency: 880, delay: 0.14, duration: 0.20, gain: 0.32 }
    ]
  },
  DATA_UPDATE: {
    mode: 'ALERTS',
    gain: 0.13,
    envelope: [0.004, 0.09, 0.12],
    voices: [
      { type: 'sine', frequency: 330, endFrequency: 495, delay: 0, duration: 0.13 },
      { type: 'sine', frequency: 660, endFrequency: 990, delay: 0.035, duration: 0.11, gain: 0.24 }
    ]
  },
  WARNING: {
    mode: 'ALERTS',
    gain: 0.20,
    envelope: [0.006, 0.12, 0.16],
    voices: [
      { type: 'triangle', frequency: 349.23, endFrequency: 329.63, delay: 0, duration: 0.20 },
      { type: 'triangle', frequency: 349.23, endFrequency: 329.63, delay: 0.21, duration: 0.20 }
    ]
  },
  CRITICAL: {
    mode: 'ALERTS',
    gain: 0.24,
    envelope: [0.004, 0.14, 0.18],
    voices: [
      { type: 'sawtooth', frequency: 196, endFrequency: 174.61, delay: 0, duration: 0.20, gain: 0.50 },
      { type: 'sine', frequency: 392, endFrequency: 349.23, delay: 0, duration: 0.20 },
      { type: 'sawtooth', frequency: 196, endFrequency: 174.61, delay: 0.25, duration: 0.20, gain: 0.50 },
      { type: 'sine', frequency: 392, endFrequency: 349.23, delay: 0.25, duration: 0.20 }
    ]
  },
  ERROR: {
    mode: 'ALERTS',
    gain: 0.20,
    envelope: [0.004, 0.10, 0.17],
    voices: [
      { type: 'sawtooth', frequency: 311.13, endFrequency: 233.08, delay: 0, duration: 0.18, gain: 0.40 },
      { type: 'triangle', frequency: 466.16, endFrequency: 349.23, delay: 0.04, duration: 0.20, gain: 0.60 }
    ]
  }
});

export function soundAllowed(soundName, mode) {
  const definition = SOUND_LIBRARY[String(soundName).toUpperCase()];
  if (!definition || mode === 'OFF') return false;
  if (mode === 'FULL') return true;
  return definition.mode === 'ALERTS';
}
