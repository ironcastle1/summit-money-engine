import { SOUND_LIBRARY, soundAllowed } from './sound-library.js';

function audioConstructor(scope = globalThis) {
  return scope.AudioContext || scope.webkitAudioContext || null;
}

function now(context) { return context?.currentTime || 0; }

export class SoundEngine {
  constructor({ mode = 'ALERTS', volume = 0.28, scope = globalThis } = {}) {
    this.scope = scope;
    this.mode = mode;
    this.volume = Number(volume);
    this.context = null;
    this.master = null;
    this.unlocked = false;
    this.lastPlayed = new Map();
    this.cooldownMs = 70;
  }

  setMode(mode) { this.mode = String(mode || 'OFF').toUpperCase(); }
  setVolume(volume) { this.volume = Math.max(0, Math.min(1, Number(volume) || 0)); }

  async unlock() {
    if (this.unlocked && this.context) return true;
    const Constructor = audioConstructor(this.scope);
    if (!Constructor) return false;
    try {
      this.context ||= new Constructor({ latencyHint: 'interactive' });
      if (this.context.state === 'suspended') await this.context.resume();
      if (!this.master) {
        this.master = this.context.createGain();
        this.master.gain.setValueAtTime(this.volume, now(this.context));
        this.master.connect(this.context.destination);
      }
      this.unlocked = this.context.state === 'running';
      return this.unlocked;
    } catch {
      this.unlocked = false;
      return false;
    }
  }

  canPlay(name) {
    if (!soundAllowed(name, this.mode) || this.volume <= 0) return false;
    const previous = this.lastPlayed.get(name) || 0;
    return Date.now() - previous >= this.cooldownMs;
  }

  async play(name, options = {}) {
    const key = String(name || '').toUpperCase();
    const definition = SOUND_LIBRARY[key];
    if (!definition || !this.canPlay(key)) return false;
    if (!await this.unlock()) return false;
    this.lastPlayed.set(key, Date.now());
    this.master.gain.cancelScheduledValues(now(this.context));
    this.master.gain.setTargetAtTime(this.volume, now(this.context), 0.012);
    const level = Math.max(0, Math.min(1, Number(options.level ?? 1)));
    const detune = Number(options.detune || 0);
    definition.voices.forEach(voice => this.#voice(voice, definition, level, detune));
    return true;
  }

  #voice(voice, definition, level, detune) {
    const start = now(this.context) + Number(voice.delay || 0);
    const duration = Math.max(0.02, Number(voice.duration || 0.1));
    const [attack = 0.004, releaseStart = duration * 0.65, release = 0.08] = definition.envelope || [];
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    const voiceGain = Number(voice.gain ?? 1) * Number(definition.gain ?? 0.15) * level;
    oscillator.type = voice.type || 'sine';
    oscillator.frequency.setValueAtTime(Math.max(20, Number(voice.frequency || 440)), start);
    oscillator.detune.setValueAtTime(detune, start);
    if (voice.endFrequency) oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, Number(voice.endFrequency)), start + duration);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, voiceGain), start + attack);
    gain.gain.setValueAtTime(Math.max(0.0002, voiceGain * 0.72), start + Math.min(duration, releaseStart));
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration + release);
    oscillator.connect(gain);
    gain.connect(this.master);
    oscillator.start(start);
    oscillator.stop(start + duration + release + 0.02);
  }

  async preview() {
    return this.play(this.mode === 'FULL' ? 'NAVIGATE' : 'SUCCESS', { level: 0.75 });
  }

  destroy() {
    try { this.context?.close?.(); } catch {}
    this.context = null;
    this.master = null;
    this.unlocked = false;
  }
}
