import { frozen } from './utilities.js';

export function planCampaign(input = {}) {
  const recipients = input.recipients || [];
  const batches = [];
  const batchSize = Math.max(1, Math.min(1000, Number(input.batchSize) || 250));
  for (let index = 0; index < recipients.length; index += batchSize) {
    batches.push(frozen({ index: batches.length + 1, recipients: Object.freeze(recipients.slice(index, index + batchSize)), scheduledFor: new Date(Number(new Date(input.startAt || Date.now())) + batches.length * Math.max(0, Number(input.intervalMinutes) || 5) * 60000).toISOString() }));
  }
  return frozen({ editionId: input.editionId, totalRecipients: recipients.length, batchSize, batches: Object.freeze(batches) });
}
