import test from 'node:test';
import assert from 'node:assert/strict';
import { onboardingProgress, adoptionScore, engagementScore, customerHealthScore, retentionRisk, expansionScore, lifecycleStage, customerSegment } from '../../src/commercial-operations/index.js';
test('onboarding progress identifies the next incomplete step', () => { const result = onboardingProgress(['PROFILE', 'TEAM']); assert.equal(result.complete, false); assert.equal(result.next.id, 'MAP_VIEW'); });
test('customer health combines adoption, engagement, support and billing', () => { const result = customerHealthScore({ adoptionScore: 90, engagementScore: 80, sentimentScore: 90 }); assert.equal(result.band, 'HEALTHY'); });
test('retention risk rises with inactivity and critical support cases', () => { const result = retentionRisk({ daysSinceActive: 20, adoptionScore: 20, openSev1: 1, pastDue: true }); assert.ok(result.risk >= 60); });
test('expansion scoring recognizes high usage and strong health', () => { const result = expansionScore({ quotaUtilization: 95, seatUtilization: 100, healthScore: 90, requestedPremiumFeatures: 3, usageGrowthPercent: 30 }); assert.equal(result.recommendation, 'ENGAGE_NOW'); });
test('lifecycle and segment classifiers are deterministic', () => { assert.equal(customerSegment({ seats: 60 }), 'ENTERPRISE'); assert.equal(lifecycleStage({ onboardingScore: 20, adoptionScore: 10 }), 'ONBOARDING'); });
test('adoption and engagement scores remain bounded', () => { assert.ok(adoptionScore({ activeFeatures: 20, availableFeatures: 2, weeklyActions: 100 }).score <= 100); assert.ok(engagementScore({ daysSinceActive: 100 }).score >= 0); });
