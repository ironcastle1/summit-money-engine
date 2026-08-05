import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { createApplication } from '../../src/app/create-application.js';
import { loadConfig } from '../../src/config/load-config.js';
import { createLogger } from '../../src/core/logger.js';
let application;
let server;
let baseUrl;
test.before(async () => {
    const config = loadConfig({ NODE_ENV: 'test', LOG_LEVEL: 'fatal', PORT: '4174' });
    application = await createApplication({ config, logger: createLogger({ level: 'fatal', service: 'part04-test' }) });
    server = createServer(application.handle);
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    baseUrl = `http://127.0.0.1:${server.address().port}`;
});
test.after(async () => { await new Promise(resolve => server.close(resolve)); await application.close(); });
test('processing status endpoint reports an initialized pipeline', async () => {
    const response = await fetch(`${baseUrl}/api/intelligence/processing/status`);
    const body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(body.ready, true);
    assert.ok(body.repositories);
});
test('manual processing endpoint returns material-event decisions', async () => {
    const response = await fetch(`${baseUrl}/api/intelligence/processing/run`, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ records: [
                { id: 'a', sourceId: 'a', source: { id: 'a', domain: 'a.example' }, title: 'Magnitude 7.0 earthquake closes major port', summary: 'Port infrastructure is damaged and shipping is halted.', category: 'earthquake', magnitude: 7, coordinate: { lat: 30, lon: 32 }, strategicAsset: true, attributes: { strategicAsset: true, shippingImpact: true }, timestamp: new Date().toISOString() },
                { id: 'b', sourceId: 'b', source: { id: 'b', domain: 'b.example' }, title: 'Major port closed after magnitude 7.0 earthquake', summary: 'Independent reports confirm halted shipping.', category: 'earthquake', magnitude: 7, coordinate: { lat: 30.1, lon: 32.1 }, strategicAsset: true, attributes: { strategicAsset: true, shippingImpact: true }, timestamp: new Date().toISOString() }
            ] })
    });
    const body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(body.recordCount, 2);
    assert.ok(body.eventCount >= 1);
    assert.ok(body.events.some(event => event.earthquakeDecision.show));
});
test('config advertises the new processing capabilities', async () => {
    const response = await fetch(`${baseUrl}/api/config`);
    const body = await response.json();
    assert.ok(body.capabilities.includes('INTELLIGENCE_PROCESSING'));
    assert.ok(body.capabilities.includes('ENTITY_RESOLUTION'));
    assert.ok(body.capabilities.includes('EVENT_FUSION'));
    assert.ok(body.capabilities.includes('MATERIAL_EVENT_FILTERING'));
});
