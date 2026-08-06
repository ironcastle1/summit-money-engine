import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const files = ['public/automation/bootstrap.js', 'public/automation/controller.js', 'public/automation/workflow-panel.js', 'public/css/automation-v20.css', 'public/index.html', 'public/merlin.js'];
test('automation client files are integrated', async () => { for (const file of files) {
    const text = await readFile(file, 'utf8');
    assert.ok(text.length > 100, `${file} should contain implementation`);
} const html = await readFile('public/index.html', 'utf8'); assert.match(html, /data-view="automation"/); const merlin = await readFile('public/merlin.js', 'utf8'); assert.match(merlin, /installAutomationSystem/); });
