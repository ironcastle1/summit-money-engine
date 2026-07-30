import { AlertCooldownRegistry } from './cooldown.js';
import { evaluateRule } from './evaluator.js';
import { normalizeAlertRule, publicAlertRule } from './rule-schema.js';

export class AlertEvaluationService {
  constructor() {
    this.cooldowns = new AlertCooldownRegistry();
  }

  evaluate(input = {}) {
    const now = input.now || Date.now();
    const rules = (input.rules || []).slice(0, 100).map(rule => normalizeAlertRule(rule, now));
    const targets = (input.targets || []).slice(0, 1000);
    const matches = [];
    for (const rule of rules) {
      if (!rule.enabled) continue;
      for (const target of targets) {
        const targetId = String(target.id || target.assetId || target.marketId || target.eventId || target.title || 'target');
        if (!this.cooldowns.canTrigger(rule, targetId, now)) continue;
        const result = evaluateRule(rule, target);
        if (!result.matched) continue;
        this.cooldowns.record(rule, targetId, now);
        matches.push({
          rule: publicAlertRule(rule),
          targetId,
          target,
          conditions: result.conditions,
          triggeredAt: new Date(now).toISOString()
        });
      }
    }
    return { matches, evaluatedRules: rules.length, evaluatedTargets: targets.length, generatedAt: new Date(now).toISOString() };
  }

  diagnostics() { return { cooldowns: this.cooldowns.snapshot().length }; }
}
