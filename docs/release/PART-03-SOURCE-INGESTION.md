# Merlin V20 Part 03 — Source ingestion framework

Part 03 replaces the event-feed registry's direct fan-out loop with a reusable ingestion platform. It is designed for public feeds, licensed feeds, customer connectors, static catalogues and derived intelligence without disguising one source mode as another.

## Delivered capabilities

- Versioned source descriptors and adapter contract validation.
- Record envelopes with stable source-scoped identifiers.
- Explicit live, snapshot, catalogue, derived and disabled source modes.
- Normalisation stages with processing metadata.
- Versioned schema validation and quarantine of invalid records.
- Exact and semantic duplicate detection within each ingestion run.
- Per-record provenance, attribution, licence, content hash and transformation chain.
- Bounded concurrency, source-specific deadlines and retry policy.
- Checkpoints for cursor and page-based connectors.
- Dead-letter storage with resolution state.
- Per-source success rates, consecutive failures and latency percentiles.
- Run history, scheduler support and operational status APIs.
- Compatibility bridge for the existing Merlin event-source adapters.
- Registry snapshots continue to expose the original event and cluster contract.

## Data-platform APIs

- `GET /api/data-platform/status`
- `GET /api/data-platform/runs`
- `GET /api/data-platform/provenance`
- `GET /api/data-platform/dead-letters`
- `GET /api/data-platform/checkpoints`
- `POST /api/data-platform/refresh`

The refresh endpoint reports a failed or degraded ingestion run honestly. It does not manufacture records when an upstream connector is unavailable.

## Operational behaviour

Deduplication resets at the start of each current-state snapshot, preventing the second refresh from returning an empty map. Exact and semantic duplicate suppression remains active inside a run. Failed sources do not discard records from successful sources; the overall run becomes `DEGRADED` and retains source-level error details.

## Merge order

Upload Part 03 after Parts 01 and 02. Allow `package.json`, `src/app/create-application.js` and `src/sources/source-registry.js` to overwrite prior copies.
