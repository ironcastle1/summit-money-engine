import test from 'node:test';import assert from 'node:assert/strict';
import { SOURCE_POLICY, BLOCKED_DOMAINS, sourcePolicyForUrl, isAllowedReportingDomain } from '../src/catalog/source-policy.js';

test('curated source policy is broad but selective',()=>assert.ok(SOURCE_POLICY.length>=80));
test('Reuters is high confidence reporting',()=>{const p=sourcePolicyForUrl('https://www.reuters.com/world/example');assert.equal(p.name,'Reuters');assert.ok(p.quality>=.95)});
test('official primary sources carry explicit primary-source mode',()=>{const p=sourcePolicyForUrl('https://ofac.treasury.gov/recent-actions/20260724');assert.equal(p.mode,'primary-claim');assert.equal(p.quality,1)});
test('state-controlled sources are retained as signalling but discounted',()=>{const p=sourcePolicyForUrl('https://tass.com/world/123');assert.equal(p.alignment,'state-controlled');assert.ok(p.quality<.6)});
test('tabloid domains are blocked',()=>{for(const d of ['dailymail.co.uk','thesun.co.uk','nypost.com'])assert.equal(sourcePolicyForUrl(`https://${d}/x`).blocked,true)});
test('subdomains inherit parent source policy',()=>assert.equal(sourcePolicyForUrl('https://feeds.bbci.co.uk/news/world').name,'BBC'));
test('unknown domains are not silently treated as trusted',()=>assert.ok(sourcePolicyForUrl('https://unknown-example.invalid/a').quality<.5));
test('allowed reporting gate excludes blocked and low-trust domains',()=>{assert.equal(isAllowedReportingDomain('https://reuters.com/x'),true);assert.equal(isAllowedReportingDomain('https://globaltimes.cn/x'),false);assert.equal(isAllowedReportingDomain('https://thesun.co.uk/x'),false)});
