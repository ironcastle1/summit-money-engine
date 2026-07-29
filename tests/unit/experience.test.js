import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_PREFERENCES,
  cycleSoundMode,
  effectiveMotionMode,
  loadPreferences,
  normalizePreferences,
  preferenceStorageKey,
  savePreferences
} from '../../public/experience/preferences.js';
import { rankCommands, createCommandRegistry } from '../../public/experience/command-registry.js';
import { soundAllowed, SOUND_LIBRARY } from '../../public/experience/sound-library.js';

function memoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem: key => values.has(key) ? values.get(key) : null,
    setItem: (key, value) => values.set(key, value),
    values
  };
}

test('experience preferences are normalized and bounded', () => {
  const normalized = normalizePreferences({ soundMode: 'full', volume: 9, density: 'invalid', motionMode: 'reduced', ambientGlow: false });
  assert.equal(normalized.soundMode, 'FULL');
  assert.equal(normalized.volume, 1);
  assert.equal(normalized.density, DEFAULT_PREFERENCES.density);
  assert.equal(normalized.motionMode, 'REDUCED');
  assert.equal(normalized.ambientGlow, false);
});

test('experience preferences persist safely', () => {
  const storage = memoryStorage();
  const saved = savePreferences({ soundMode: 'OFF', volume: 0.5, density: 'COMPACT' }, storage);
  const loaded = loadPreferences(storage);
  assert.deepEqual(loaded, saved);
  assert.ok(storage.values.has(preferenceStorageKey()));
});

test('invalid stored preferences fall back to defaults', () => {
  const storage = memoryStorage({ [preferenceStorageKey()]: '{bad-json' });
  assert.deepEqual(loadPreferences(storage), DEFAULT_PREFERENCES);
});

test('sound mode cycle is deterministic', () => {
  assert.equal(cycleSoundMode('OFF'), 'ALERTS');
  assert.equal(cycleSoundMode('ALERTS'), 'FULL');
  assert.equal(cycleSoundMode('FULL'), 'OFF');
});

test('system motion honours reduced-motion media query', () => {
  const media = () => ({ matches: true });
  assert.equal(effectiveMotionMode({ motionMode: 'SYSTEM' }, media), 'REDUCED');
  assert.equal(effectiveMotionMode({ motionMode: 'FULL' }, media), 'FULL');
});

test('sound library separates alert and full interface cues', () => {
  assert.ok(SOUND_LIBRARY.SUCCESS);
  assert.equal(soundAllowed('SUCCESS', 'ALERTS'), true);
  assert.equal(soundAllowed('NAVIGATE', 'ALERTS'), false);
  assert.equal(soundAllowed('NAVIGATE', 'FULL'), true);
  assert.equal(soundAllowed('SUCCESS', 'OFF'), false);
});

test('command ranking finds views and actions without fabricated entries', () => {
  const commands = createCommandRegistry();
  assert.equal(rankCommands(commands, 'shipping')[0].view, 'shipping');
  assert.equal(rankCommands(commands, 'sound')[0].id, 'action:sound');
  assert.equal(rankCommands(commands, 'no-such-command').length, 0);
});

test('empty command query preserves stable registry order and limit', () => {
  const commands = createCommandRegistry();
  const results = rankCommands(commands, '', 4);
  assert.equal(results.length, 4);
  assert.deepEqual(results, commands.slice(0, 4));
});
