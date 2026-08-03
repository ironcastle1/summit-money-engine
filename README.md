# MERLIN V17.1.0 — GLOBAL INTELLIGENCE

Merlin is a map-first global intelligence and opportunity platform spanning events, markets, verified news, shipping, trade flows, countries, cities, accounts, alerts and replay analysis. The persistent interactive world map is the main product surface; alerts, news, earthquakes, disasters, conflict, ports, shipping routes and country risk are toggleable map layers.


## Merlin interface

- Detailed MapLibre/OpenFreeMap streets and political map with pan, zoom, search, geolocation and clickable entities.
- News is integrated into the map and right-hand drawer rather than separated into a standalone page.
- Toggleable live-alert, news, earthquake, disaster, conflict, route, port, country-risk and activity-heat layers.
- Opportunity cards state WHERE to go, WHAT to do, WHO to target, starting capital, time window and estimated value.
- Shipping is ranked as financially actionable route, port and commodity opportunities.
- Countries without real measured evidence show no score; there is no universal default confidence number.
- Audio is disabled.
- The production Docker build vendors MapLibre locally; CDN and interactive local-map fallbacks remain available.

## Full repository installation

This is a complete repository, not an incremental patch. Delete the old repository contents, then upload every file and folder from this package into the repository root. GitHub's browser uploader accepts no more than 100 files per upload, so use the numbered browser-upload batches supplied alongside the complete archive when uploading through the website.

Hidden files such as `.gitignore`, `.dockerignore`, `.env.example`, and `.github/workflows/ci.yml` are intentional. Do not commit an actual `.env` file or any private credentials.

## Run

```bash
npm start
```

Open `http://localhost:4173`.

## Verify

```bash
npm test
npm run verify
npm run lines
```

## Parts installed

### Part 1 — Core map and radius engine

Self-contained local vector map, coordinate-specific radius analysis, event normalization, clustering, place search, route overlay, source health, caching, circuit breakers and diagnostics.

### Part 2 — Markets

Historical candles, multi-timeframe analysis, analogue probabilities, downside ranges, screeners, prediction markets, charts, watchlists and market-source health.

### Part 3 — Opportunities, alerts and replay

Fused evidence, ranked opportunities, alert rules, saved workspaces, exports, trade replay, fees, slippage, position sizing and walk-forward results.

### Part 4 — News, social and verification

GDELT and RSS ingestion, optional credentialled X adapter, story correlation, provenance, source reliability, corroboration, claim agreement, contradiction detection and velocity analysis.

### Part 5 — Shipping, trade flows and commodities

Port, chokepoint, route, commodity, operational-source, trade-flow and supply-risk intelligence.

### Part 6 — Country and city intelligence

Global country/city catalogues, location-specific conflict/disaster analysis, supported local crime, election proximity, economic indicators and place drill-downs.

### Part 7 — Accounts, subscriptions and administration

- Registration, sign-in, sign-out and secure cookie sessions.
- Scrypt password hashing, account lockout and password rotation.
- CSRF verification for authenticated state changes.
- Free, Pro and Team entitlement plans with explicit limits.
- Stripe and PayPal recurring-subscription checkout adapters.
- Coinbase one-time access checkout adapter.
- Signed webhook verification and duplicate-event protection.
- Server-backed watchlists, workspaces, alert rules, saved searches and preferences.
- Local/server push, pull and merge controls.
- Owner bootstrap, admin metrics, user search, role controls, suspension and manual plan grants.
- Persistent audit events and provider-health states.
- Atomic local JSON persistence with restrictive file permissions.
- `NOT_CONFIGURED` states when a payment provider lacks credentials.

## Initial owner account

Set all three values before the first production start:

```text
OWNER_EMAIL=owner@example.com
OWNER_PASSWORD=replace-with-a-long-unique-password
OWNER_DISPLAY_NAME=Owner
```

The owner is created only when no account already uses that email. Remove the password from the environment after the initial account has been created.

## Production account settings

```text
NODE_ENV=production
SESSION_SECRET=replace-with-at-least-32-random-characters
PUBLIC_ORIGIN=https://your-domain.example
SECURE_COOKIES=true
ACCOUNT_DATA_FILE=runtime-data/accounts.json
ALLOW_REGISTRATION=true
```

`runtime-data/` is excluded from Git. Back it up independently or replace the JSON repositories with a managed database before running multiple application instances.

## Billing configuration

Configure one or more providers. Unconfigured providers stay visible as `NOT_CONFIGURED` and cannot start checkout.

```text
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_PRO=
STRIPE_PRICE_TEAM=

PAYPAL_CLIENT_ID=
PAYPAL_CLIENT_SECRET=
PAYPAL_WEBHOOK_ID=
PAYPAL_PLAN_PRO=
PAYPAL_PLAN_TEAM=

COINBASE_API_KEY_ID=
COINBASE_API_KEY_SECRET=
COINBASE_BUSINESS_BEARER_TOKEN=
COINBASE_WEBHOOK_SECRET=
COINBASE_CURRENCY=USDC
COINBASE_NETWORK=base
```

Webhook routes:

```text
/api/billing/webhooks/stripe
/api/billing/webhooks/paypal
/api/billing/webhooks/coinbase
```

## Resilient data operation

The application includes bundled, timestamped event, news and market snapshots so the core product remains populated when a public upstream throttles or fails. Supported crypto assets also attempt public Coinbase Exchange and direct browser-side market history, then calculate empirical probabilities only from returned observations. API requests are never intercepted by the service worker, and service-worker registration is disabled in V17.1.0 to prevent stale offline responses.

## Experience controls

- `Ctrl/Command + K`: command palette
- Audio is permanently muted in this release. The control remains disabled so interaction sounds cannot restart through stored browser preferences.
- Diamond button: opens display and sound settings
- `Alt + 1` through `Alt + 0`: switch main views
