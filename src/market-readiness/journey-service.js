import { CUSTOMER_JOURNEYS } from './catalog.js';

export class CustomerJourneyService {
  constructor(options = {}) {
    this.clock = options.clock || (() => new Date().toISOString());
    this.results = new Map();
  }

  record(input = {}) {
    const journey = CUSTOMER_JOURNEYS.find(item => item.id === input.journeyId);
    if (!journey) throw new Error(`Unknown customer journey: ${input.journeyId}`);
    const result = Object.freeze({
      journeyId: journey.id,
      title: journey.title,
      browser: input.browser || 'unknown',
      device: input.device || 'unknown',
      status: input.status === 'PASS' ? 'PASS' : 'FAIL',
      durationMs: Math.max(0, Number(input.durationMs) || 0),
      failedStep: input.failedStep || null,
      evidence: input.evidence || null,
      recordedAt: this.clock()
    });
    this.results.set(`${result.journeyId}:${result.browser}:${result.device}`, result);
    return result;
  }

  snapshot() {
    const results = [...this.results.values()];
    const passed = results.filter(result => result.status === 'PASS').length;
    return Object.freeze({
      catalog: CUSTOMER_JOURNEYS,
      results,
      coverage: CUSTOMER_JOURNEYS.length ? Math.round((new Set(results.map(result => result.journeyId)).size / CUSTOMER_JOURNEYS.length) * 100) : 0,
      passRate: results.length ? Math.round((passed / results.length) * 100) : 0
    });
  }
}
