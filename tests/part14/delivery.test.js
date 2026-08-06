import test from 'node:test';
import assert from 'node:assert/strict';
import { PublicationDeliveryRouter, createPublicationWebhookChannel, resolveRecipients } from '../../src/publishing/index.js';
import { subscriberFixture } from './fixtures.js';

test('recipient resolution enforces classification clearance', () => { const subscribers = [subscriberFixture(), { ...subscriberFixture(), id: 'low', clearance: 'PUBLIC' }]; const output = resolveRecipients({ subscribers, subscriberIds: ['subscriber-test', 'low'], classification: 'CLIENT' }); assert.deepEqual(output.map(item => item.id), ['subscriber-test']); });
test('unconfigured delivery channels are honestly suppressed', async () => { const router = new PublicationDeliveryRouter(); const results = await router.deliver({ recipient: { id: 'r' } }, ['EMAIL']); assert.equal(results[0].state, 'SUPPRESSED'); assert.equal(results[0].reason, 'CHANNEL_NOT_CONFIGURED'); });
test('webhook channel validates HTTP delivery status', async () => { const channel = createPublicationWebhookChannel({ fetchImpl: async () => ({ ok: true, status: 204 }) }); const result = await channel.deliver({ recipient: { id: 'r', webhookUrl: 'https://example.test' }, payload: {} }); assert.equal(result.state, 'DELIVERED'); assert.equal(result.status, 204); });
test('webhook channel suppresses recipients without configured endpoint', async () => { const channel = createPublicationWebhookChannel({ fetchImpl: async () => ({ ok: true, status: 200 }) }); const result = await channel.deliver({ recipient: { id: 'r' }, payload: {} }); assert.equal(result.state, 'SUPPRESSED'); });
