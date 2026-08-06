import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('customer shell exposes current map navigation, search and skip navigation', async () => {
  const html = await readFile('public/index.html', 'utf8');
  assert.match(html, /class="skip-link"/);
  assert.match(html, /id="mobile-menu"/);
  assert.match(html, /id="search-toggle"/);
  assert.match(html, /merlin-v24\.js\?v=24\.1\.0/);
});

test('customer shell removes theme switching, seismic news and internal administration', async () => {
  const html = await readFile('public/index.html', 'utf8');
  assert.doesNotMatch(html, /theme-select|data-theme/);
  assert.doesNotMatch(html, /earthquake/i);
  assert.doesNotMatch(html, /data-view="(?:operations|security|customers|release|publishing|automation)"/i);
  assert.match(html, /data-view="opportunities"/);
  assert.match(html, /data-view="briefing"/);
});

test('browser entry enforces current windows and renders commercial opportunities', async () => {
  const source = await readFile('public/merlin-v24.js', 'utf8');
  assert.match(source, /EARTH_TERMS/);
  assert.match(source, /data-hours|state\.hours/);
  assert.match(source, /opportunityCard/);
  assert.match(source, /renderBriefing/);
});

test('responsive stylesheet includes mobile, reduced-motion and focus treatment', async () => {
  const css = await readFile('public/css/merlin-v24.css', 'utf8');
  assert.match(css, /@media\s*\(max-width:\s*860px\)/);
  assert.match(css, /prefers-reduced-motion/);
  assert.match(css, /:focus-visible/);
  assert.match(css, /overflow(?:-y)?:\s*(?:auto|scroll)/);
});
