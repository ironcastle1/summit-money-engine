import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readdir } from 'node:fs/promises';
test('browser decision support package contains all operational panels', async () => {
  const directory = new URL('../../public/decision-support/', import.meta.url);
  const files = (await readdir(directory)).filter(file => file.endsWith('.js'));
  assert.ok(files.length >= 12);
  for (const required of ['bootstrap.js','controller.js','briefing-view.js','evidence-panel.js','workspace-panel.js','case-file-panel.js','report-panel.js']) await access(new URL(required, directory));
});
