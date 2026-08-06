import test from 'node:test';
import assert from 'node:assert/strict';
import { linearRegression, TrendDetector } from '../../src/intelligence-processing/trend-detector.js';
import { AnomalyDetector } from '../../src/intelligence-processing/anomaly-detector.js';
import { NarrativeClusterer } from '../../src/intelligence-processing/narrative-clusterer.js';
test('linear regression and trend detector identify acceleration', () => {
    const regression = linearRegression([1, 2, 3, 4, 5]);
    assert.ok(Math.abs(regression.slope - 1) < 0.001);
    assert.equal(regression.r2, 1);
    const trend = new TrendDetector().analyse([1, 2, 3, 5, 8, 12, 17, 23]);
    assert.equal(trend.direction, 'RISING');
    assert.ok(trend.acceleration > 0);
});
test('anomaly detector flags a strong outlier using classical and robust scores', () => {
    const result = new AnomalyDetector().analyse([10, 11, 10, 9, 10, 11, 10, 100], { zThreshold: 2, robustThreshold: 3 });
    assert.ok(result.anomalies.some(item => item.value === 100));
    assert.ok(result.median >= 10 && result.median <= 11);
});
test('narrative clusterer groups related coverage', () => {
    const clusters = new NarrativeClusterer({ threshold: 0.35 }).cluster([
        { id: 'a', title: 'Suez Canal blocked by grounded vessel', summary: 'Container traffic halted.' },
        { id: 'b', title: 'Grounded ship halts Suez Canal traffic', summary: 'Shipping queues grow.' },
        { id: 'c', title: 'Wildfire expands in California', summary: 'Homes evacuated.' }
    ]);
    assert.equal(clusters.length, 2);
    assert.ok(clusters.some(cluster => cluster.events.length === 2));
});
