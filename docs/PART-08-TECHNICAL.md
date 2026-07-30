# Part 08 — Production Integration

## Runtime

Part 8 adds process and HTTP telemetry, readiness/liveness endpoints, source and catalogue quality scoring, browser telemetry, PWA installation and offline-shell support. Runtime values are measured; absent evidence remains `N/A`.

## Endpoints

- `GET /api/ops/live` — process liveness.
- `GET /api/ops/ready` — readiness based on heap, event-loop delay and configured feed failures.
- `GET /api/ops/health` — complete health snapshot.
- `GET /api/ops/quality` — source and static-catalogue quality.
- `GET /api/ops/build` — version, commit, deployment and capability data.
- `GET /api/ops/metrics` — JSON metrics; use `?format=prometheus` for text exposition.
- `POST /api/ops/client-report` — bounded Web Vital, browser error and connectivity reports.

## Static delivery

Static assets use ETags, conditional requests, Last-Modified, Brotli/gzip negotiation and production cache headers. HTML, service-worker and manifest files are always revalidated.

## Security

State-changing browser requests are origin checked. Billing webhooks remain exempt because their signatures are verified independently. Response headers deny framing and objects, constrain permissions and set a restrictive content-security policy.

## Deployment

Docker, Docker Compose, Render and Fly configuration are included. GitHub Actions runs tests, syntax verification, environment validation, a high-confidence embedded-secret scan and line counting. Persistent account data must be mounted outside the immutable container layer.

## PWA

The service worker caches the application shell and public read-only API responses. Authentication, billing, account, administration and user-data endpoints are never cached. Live map tiles use stale-while-revalidate; navigation falls back to the dedicated offline page.
