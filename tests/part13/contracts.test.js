import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
test('application registers automation service and routes', async () => { const app = await readFile('src/app/create-application.js', 'utf8'); assert.match(app, /createAutomationPlatformService/); assert.match(app, /registerAutomationRoutes/); const routes = await readFile('src/api/register-automation-routes.js', 'utf8'); for (const endpoint of ['/api/automation/catalog', '/api/automation/workflows', '/api/automation/workflows/run', '/api/automation/runs', '/api/automation/notifications'])
    assert.ok(routes.includes(endpoint)); });
