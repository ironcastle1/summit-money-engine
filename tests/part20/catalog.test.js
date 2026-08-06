import test from 'node:test';
import assert from 'node:assert/strict';
import { ACCEPTANCE_DOMAINS, BROWSER_MATRIX, CUSTOMER_JOURNEYS, DEVICE_MATRIX, THEMES } from '../../src/market-readiness/catalog.js';

test('device matrix covers six required customer viewports', () => {
  assert.equal(DEVICE_MATRIX.length, 6);
  assert.ok(DEVICE_MATRIX.every(device => device.required));
  assert.deepEqual(DEVICE_MATRIX.map(device => device.id), ['mobile-small', 'mobile-large', 'tablet', 'laptop', 'desktop', 'ultrawide']);
});

test('browser matrix identifies all target rendering engines', () => {
  assert.deepEqual(BROWSER_MATRIX.map(browser => browser.id), ['chromium', 'firefox', 'webkit']);
  assert.ok(BROWSER_MATRIX.every(browser => browser.required));
});

test('customer journeys cover core commercial workflows', () => {
  assert.equal(CUSTOMER_JOURNEYS.length, 10);
  for (const id of ['first-run', 'morning-brief', 'map-investigation', 'route-exposure', 'market-opportunity', 'publish-report', 'offline-recovery']) {
    assert.ok(CUSTOMER_JOURNEYS.some(journey => journey.id === id));
  }
  assert.ok(CUSTOMER_JOURNEYS.every(journey => journey.steps.length >= 4));
});

test('six whole-product themes are catalogued', () => {
  assert.equal(THEMES.length, 6);
  assert.equal(new Set(THEMES.map(theme => theme.id)).size, 6);
  assert.ok(THEMES.some(theme => theme.id === 'light' && theme.dark === false));
  assert.ok(THEMES.some(theme => theme.id === 'midnight' && theme.dark === true));
});

test('acceptance domains include map, accessibility and security', () => {
  assert.ok(ACCEPTANCE_DOMAINS.includes('map'));
  assert.ok(ACCEPTANCE_DOMAINS.includes('accessibility'));
  assert.ok(ACCEPTANCE_DOMAINS.includes('performance'));
  assert.ok(ACCEPTANCE_DOMAINS.includes('security'));
  assert.equal(new Set(ACCEPTANCE_DOMAINS).size, ACCEPTANCE_DOMAINS.length);
});
