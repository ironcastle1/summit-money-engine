# Merlin V20 Part 04 — Intelligence Processing and Event Fusion

Part 04 converts normalized source records into evidence-backed operational events. It is designed to sit between the Part 03 ingestion platform and later map, overlay, workflow, alerting and reporting packages.

## Processing path

1. Normalize timestamps, text, coordinates and source identifiers.
2. detect language and preserve English-first/local-name labels.
3. Extract entities, places, claims, numbers and operational signals.
4. Resolve aliases while rejecting conflicting identifiers.
5. Evaluate evidence quality, source reputation and manipulation risk.
6. Remove semantic duplicates without discarding provenance.
7. Cluster related reports by text, entities, time, category and geography.
8. Fuse clusters into one event while retaining source and record lineage.
9. Compare claims for numeric, polarity, object and status contradictions.
10. Measure independent corroboration and produce a confidence score.
11. Classify direct and propagated impacts across fifteen operational domains.
12. Apply materiality policy and the major-impact-only earthquake gate.
13. Rank events by relevance, proximity, recency, confidence and impact.
14. Generate narratives, summaries, verification gaps and scenario seeds.
15. Record every show/filter decision in an explainable decision log.

## Major-earthquake policy

Routine seismic activity is not exposed as general map noise. An earthquake becomes visible only when one or more material conditions are met, including major magnitude, populated-area exposure, tsunami potential, strategic-asset effects, shipping or port disruption, national infrastructure failure or material human impact.

## API surface

- `GET /api/intelligence/processing/status`
- `POST /api/intelligence/processing/run`
- `POST /api/intelligence/processing/live`
- `GET /api/intelligence/material-events`
- `GET /api/intelligence/material-events/:id`
- `GET /api/intelligence/entities/:id`
- `GET /api/intelligence/narratives/:id`
- `POST /api/intelligence/entities/resolve`
- `POST /api/intelligence/claims/corroborate`

## Integration

Part 04 replaces `package.json`, `src/app/create-application.js` and `src/api/register-api-routes.js`. It adds a processing platform service and registers the processing routes without removing existing accounts, billing, ingestion, map, market, news, shipping or intelligence services.
