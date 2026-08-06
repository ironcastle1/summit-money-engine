import test from 'node:test';
import assert from 'node:assert/strict';
import { ClaimExtractor } from '../../src/intelligence-processing/claim-extractor.js';
import { createClaim } from '../../src/intelligence-processing/claim-schema.js';
import { compareClaims, ContradictionDetector } from '../../src/intelligence-processing/contradiction-detector.js';
import { independenceScore, independentGroups } from '../../src/intelligence-processing/source-independence.js';
import { CorroborationEngine } from '../../src/intelligence-processing/corroboration-engine.js';
test('claim extractor creates quantitative and forecast claims', () => {
    const claims = new ClaimExtractor().extract({ id: 'r1', sourceId: 'a', title: 'Officials say 25 people were injured and the port will reopen tomorrow.' });
    assert.ok(claims.some(item => item.type === 'QUANTITY' && item.value === 25));
    assert.ok(claims.some(item => item.type === 'FORECAST'));
});
test('claim comparison detects numeric and polarity conflicts', () => {
    const a = createClaim({ type: 'QUANTITY', statement: '10 dead', predicate: 'deaths', value: 10, unit: 'deaths' });
    const b = createClaim({ type: 'QUANTITY', statement: '100 dead', predicate: 'deaths', value: 100, unit: 'deaths' });
    assert.equal(compareClaims(a, b).contradiction, true);
    const c = createClaim({ type: 'OCCURRENCE', statement: 'Attack happened', predicate: 'occurred', polarity: 1 });
    const d = createClaim({ type: 'OCCURRENCE', statement: 'Attack did not happen', predicate: 'occurred', polarity: -1 });
    assert.equal(compareClaims(c, d).contradiction, true);
});
test('contradiction detector summarizes pairwise evidence', () => {
    const claims = [
        createClaim({ type: 'STATUS', statement: 'Port open', predicate: 'status', object: 'OPEN' }),
        createClaim({ type: 'STATUS', statement: 'Port closed', predicate: 'status', object: 'CLOSED' })
    ];
    const result = new ContradictionDetector().analyse(claims);
    assert.equal(result.conflicts.length, 1);
    assert.equal(result.disputed, true);
});
test('source independence groups syndicated or commonly owned outlets', () => {
    assert.ok(independenceScore({ id: 'reuters' }, { id: 'thomson-reuters' }) < 0.5);
    assert.equal(independenceScore({ id: 'reuters' }, { id: 'bbc' }), 1);
    assert.equal(independentGroups([{ id: 'bbc' }, { id: 'bbc-world' }, { id: 'reuters' }]).length, 2);
});
test('corroboration rewards independent support and marks disputes', () => {
    const engine = new CorroborationEngine();
    const claims = [
        createClaim({ type: 'OCCURRENCE', statement: 'Port closed', predicate: 'occurred', sourceId: 'a', confidence: 80 }),
        createClaim({ type: 'OCCURRENCE', statement: 'Port closed', predicate: 'occurred', sourceId: 'b', confidence: 80 })
    ];
    const supported = engine.assess(claims, id => ({ id, domain: `${id}.example` }));
    assert.equal(supported.corroborated, true);
    const disputed = engine.assess([...claims, createClaim({ type: 'OCCURRENCE', statement: 'Port not closed', predicate: 'occurred', sourceId: 'c', polarity: -1, confidence: 80 })], id => ({ id, domain: `${id}.example` }));
    assert.equal(disputed.disputed, true);
    assert.ok(disputed.score < supported.score);
});
