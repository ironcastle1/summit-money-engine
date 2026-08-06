import test from 'node:test';
import assert from 'node:assert/strict';
import { reliabilityCatalog, DEFAULT_SERVICES, SLO_TEMPLATES, RUNBOOKS, environmentById } from '../../src/reliability-operations/index.js';
test('reliability catalog exposes market-ready operations capability', () => { const catalog = reliabilityCatalog(); assert.equal(catalog.platform, 'MERLIN_RELIABILITY_OPERATIONS'); assert.equal(catalog.version, '20.17.0'); assert.ok(catalog.capabilities.includes('ERROR_BUDGETS')); assert.ok(DEFAULT_SERVICES.length >= 8); assert.ok(SLO_TEMPLATES.length >= 5); assert.ok(RUNBOOKS.length >= 5); });
test('environment catalog distinguishes production controls', () => { assert.equal(environmentById('production').approvalRequired, true); assert.equal(environmentById('development').production, false); });
