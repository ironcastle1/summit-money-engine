import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const files = ['public/automation/bootstrap.js', 'public/automation/controller.js', 'public/automation/workflow-panel.js', 'public/css/automation-v20.css'];

test('automation implementation remains available but is not exposed in the customer navigation', async () => {
  for (const file of files) {
    const text = await readFile(file, 'utf8');
    assert.ok(text.length > 100, `${file} should contain implementation`);
  }
  const html = await readFile('public/index.html', 'utf8');
  assert.doesNotMatch(html, /data-view="automation"|automation-v20\.css/);
});
