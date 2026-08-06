import test from 'node:test';
import assert from 'node:assert/strict';
import { artifactManifest, checksumManifest, verifyChecksumManifest, buildProvenance, softwareBillOfMaterials, licenseReport, thirdPartyAttribution } from '../../src/release-engineering/index.js';
test('artifact manifest is deterministic and hashed', () => { const value = artifactManifest([{ name: 'a', path: 'a.js', bytes: 10, sha256: 'x' }], { version: '1.0.0' }); assert.equal(value.count, 1); assert.equal(value.manifestSha256.length, 64); });
test('checksum verifier detects mismatch', () => { const manifest = checksumManifest([{ path: 'a', sha256: 'x' }]); assert.equal(verifyChecksumManifest(manifest, [{ path: 'a', sha256: 'y' }]).valid, false); });
test('provenance includes attestation', () => assert.equal(buildProvenance({ sourceRevision: 'abc' }).attestation.length, 64));
test('SBOM and licence report expose policy state', () => { const sbom = softwareBillOfMaterials({ components: [{ name: 'x', version: '1', license: 'MIT' }] }); assert.equal(licenseReport(sbom.components).valid, true); assert.match(thirdPartyAttribution(sbom.components), /x 1/); });
