import test from 'node:test';
import assert from 'node:assert/strict';
import { releaseReadiness, canaryAnalysis, rollbackDecision, rolloutStrategy, configurationDrift, deploymentPlan } from '../../src/reliability-operations/index.js';
test('release readiness blocks missing safety gates', () => { const result = releaseReadiness({ testsPassed: true, syntaxPassed: true, securityPassed: false, backupVerified: true, rollbackPlan: 'undo', approved: true }); assert.equal(result.ready, false); assert.ok(result.blockers.includes('security')); });
test('canary regression triggers controlled rollback', () => { const canary = canaryAnalysis({ baseline: { errorRate: .001, p95LatencyMs: 100, saturation: 40 }, canary: { errorRate: .03, p95LatencyMs: 600, saturation: 80, syntheticPassed: false } }); assert.equal(canary.proceed, false); assert.equal(rollbackDecision({ canary }).rollback, true); });
test('rollout and drift logic are deterministic', () => { assert.equal(rolloutStrategy({ riskLevel: 'HIGH', serviceTier: 1 }).strategy, 'CANARY'); assert.equal(configurationDrift({ a: 1 }, { a: 2 }).drifted, true); assert.equal(deploymentPlan({ releaseId: 'r' }).stages.at(-1).percentage, 100); });
