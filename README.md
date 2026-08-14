# MERLIN V8

MERLIN is a public-source geopolitical, market, maritime, sanctions, cyber, energy and policy monitoring application. V8 is a clean implementation focused on a working interactive map, resilient public-source ingestion, explicit provenance, and practical market/security analysis.

## Run

Requires Node.js 20+.

```bash
npm test
npm start
```

Render can use the included `render.yaml`. No database or npm dependencies are required for the default application.

## Data behavior

At startup MERLIN loads a timestamped build snapshot so the customer interface is never an unexplained empty shell. It immediately refreshes configured public sources unless `MERLIN_DISABLE_LIVE=1` is set. Live records replace/fuse with snapshot records. Every fallback record is labelled `BUILD SNAPSHOT — NOT LIVE`; failed upstreams stay visible in Source Diagnostics.

Runtime source modes are `LIVE`, `MIXED`, `BUILD_SNAPSHOT`, or `EMPTY`.

## Map

The map is a custom Web Mercator canvas renderer with a bundled 4096×4096 dark-blue relief base. It supports touchpad/mouse-wheel zoom, drag pan, double-click zoom, pointer pinch zoom, country polygon hit-testing, country borders, country-risk shading, shipping routes, ports, strategic nodes, supply-chain markers, alert rings, heat, and independent analytic overlay glyphs.

## Public-source coverage

V8 configures 44 public-source streams: 24 focused GDELT discovery searches, 7 RSS feeds, 4 structured public JSON feeds, and 9 market streams. The system deliberately reports failed or empty sources instead of counting them as live coverage.

No private communications interception or unauthorized signals collection is included.

## Verification

Run:

```bash
npm test
node scripts/verify.js
node scripts/http-smoke.mjs
python3 scripts/browser-test.py
```

The browser acceptance suite uses Chromium and the exact production client with a deterministic timestamped build-snapshot fixture when the isolated build browser cannot access external publishers. It sends real wheel and pointer input to the canvas and verifies pixel changes for borders, routes, signals, conflict, politics, sanctions, maritime, energy, cyber and market overlays.
