import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeText, extractNumbers, redactSensitiveText } from '../../src/intelligence-processing/text-normalizer.js';
import { weightedTextSimilarity } from '../../src/intelligence-processing/token-similarity.js';
import { haversineDistanceKm, boundingBox, centroid } from '../../src/intelligence-processing/geo-utils.js';
test('text normalisation is deterministic and removes control noise', () => {
    assert.equal(normalizeText('  Café\u0000  <b>ALERT</b>  '), 'cafe alert');
    assert.equal(normalizeText('Café ALERT'), 'cafe alert');
});
test('number extraction handles magnitudes, percentages and abbreviations', () => {
    const values = extractNumbers('Magnitude 6.8; 25% affected; losses 2.5bn USD and 4,000 people displaced.');
    assert.ok(values.some(item => item.value === 6.8));
    assert.ok(values.some(item => item.value === 25 && item.unit === '%'));
    assert.ok(values.some(item => item.value === 2500000000));
    assert.ok(values.some(item => item.value === 4000));
});
test('text similarity distinguishes near duplicates from unrelated text', () => {
    const close = weightedTextSimilarity('Port of Suez closes after vessel grounding', 'Suez port closed following grounded vessel');
    const far = weightedTextSimilarity('Port of Suez closes after vessel grounding', 'Coffee prices rise in Brazil');
    assert.ok(close > far);
    assert.ok(close > 0.45);
});
test('geographic functions return practical distances and bounds', () => {
    const distance = haversineDistanceKm({ lat: 51.5074, lon: -0.1278 }, { lat: 48.8566, lon: 2.3522 });
    assert.ok(distance > 330 && distance < 360);
    const bounds = boundingBox({ lat: 51.5, lon: -0.1 }, 100);
    assert.ok(bounds.north > 51.5 && bounds.south < 51.5);
});
test('centroid and redaction support safe processing', () => {
    const middle = centroid([{ lat: 50, lon: 0 }, { lat: 52, lon: 0 }]);
    assert.ok(middle.lat > 50.9 && middle.lat < 51.1);
    const safe = redactSensitiveText('Email x@example.com or call +44 7700 900123 at https://example.com');
    assert.match(safe, /\[email\]/);
    assert.match(safe, /\[phone\]/);
    assert.match(safe, /\[url\]/);
});
