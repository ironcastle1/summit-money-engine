import test from 'node:test';
import assert from 'node:assert/strict';
import { NotificationRouter, NotificationStore, createInAppChannel } from '../../src/automation-workflows/index.js';
test('notification router delivers in-app and exposes unavailable connectors', async () => { const store = new NotificationStore(); const router = new NotificationRouter({ store }).register('IN_APP', createInAppChannel(store)); const result = await router.route({ owner: 'u', title: 'Test', body: 'Body', channels: ['IN_APP', 'EMAIL'] }); assert.equal(result.delivered, 1); assert.equal(result.results.find(item => item.channel === 'EMAIL').state, 'UNAVAILABLE'); assert.equal((await store.list('u')).length, 2); });
