# MERLIN V20 — Global Intelligence and Opportunity Platform

Merlin is a map-first operating system for monitoring world events, market reactions, logistics exposure, political risk and commercial opportunities. V20 is built as a complete continuation of the uploaded V18 repository, retaining its accounts, billing, data adapters, local fallback datasets and deployment targets while expanding the product into an 18-part market release plus the Part 19 public-first live-data upgrade.

## Product principles

- The map remains the primary working surface.
- Shipping intelligence is exposed through map layers, route analysis and contextual drawers rather than a standalone navigation tab.
- Earthquakes are shown only when they meet a material-impact policy covering major magnitude, population exposure, infrastructure, ports, chokepoints or national disruption.
- Core public feeds warm automatically without mandatory API keys. Static catalogues, cached snapshots and configured connectors remain labelled separately.
- Every map entity is expected to open a usable detail surface.
- English is the primary map label, with the local name displayed second where available.
- Panels and drawers are viewport-bounded and independently scrollable.
- Themes apply to the application shell, charts and map treatment together.

## Runtime

Requirements:

- Node.js 20 or newer
- No mandatory runtime npm dependencies
- A writable `runtime-data` directory for account and session storage

Development:

```bash
cp .env.example .env
npm start
```

Open `http://localhost:4173`.

Production minimum:

```text
NODE_ENV=production
PUBLIC_ORIGIN=https://your-domain.example
SESSION_SECRET=<at-least-32-random-characters>
SECURE_COOKIES=true
```

The startup readiness gate refuses unsafe production placeholders. The public-first live-data platform starts automatically and persists its last successful source snapshots. ReliefWeb, ACLED, X and licensed global AIS remain optional because their providers require approved application identifiers, credentials or commercial access.

## Verification

```bash
npm run test:part01
npm run verify:part01
npm test
npm run verify
npm run security:scan
npm run lines
```

The complete release is delivered in numbered ZIP packages. Every package contains fewer than 100 files and preserves repository-relative paths. Extract each package and upload its contents into the same GitHub repository in numerical order.

## Release structure

See `docs/release/V20-PARTS.md` for the original 18-part delivery map and `docs/PART-19-LIVE-DATA.md` for the public-first live-data upgrade.
