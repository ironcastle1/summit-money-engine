import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('customer shell exposes mobile navigation, themes, help and skip navigation', async () => {
  const html = await readFile('public/index.html', 'utf8');
  assert.match(html, /class="skip-link"/);
  assert.match(html, /id="mobile-nav-toggle"/);
  assert.match(html, /id="theme-select"/);
  assert.match(html, /id="help-button"/);
  assert.match(html, /merlin\.js\?v=20\.20\.1/);
});

test('customer shell has six theme choices and no Shipping navigation item', async () => {
  const html = await readFile('public/index.html', 'utf8');
  const themeSelect = html.match(/<select id="theme-select"[\s\S]*?<\/select>/)?.[0] || '';
  const options = [...themeSelect.matchAll(/<option value="(midnight|graphite|forest|crimson|sand|light)"/g)];
  assert.equal(options.length, 6);
  assert.doesNotMatch(html, /data-view="shipping"/i);
});

test('browser entry installs readiness controls and material earthquake filtering', async () => {
  const source = await readFile('public/merlin.js', 'utf8');
  assert.match(source, /installMarketReadiness/);
  assert.match(source, /function isMaterialEvent/);
  assert.match(source, /20\.20\.1/);
  assert.doesNotMatch(source, /STARTING CAPITAL/);
});

test('responsive stylesheet includes mobile, reduced-motion and focus treatment', async () => {
  const css = await readFile('public/css/readiness-v20.css', 'utf8');
  assert.match(css, /@media\s*\(max-width:\s*860px\)/);
  assert.match(css, /prefers-reduced-motion/);
  assert.match(css, /:focus-visible/);
  assert.match(css, /data-theme="forest"/);
});
