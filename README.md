# MERLIN V22 — Global Intelligence and Opportunity Platform

Merlin is a map-first operating system for monitoring world events, market reactions, logistics exposure, political risk and commercial opportunities. The V22 release retains the complete V20 intelligence, account, billing, live-data, security and operations platform while replacing the customer-facing interface with a unified premium visual system.

## V22 interface

- Permanent professional navigation arranged by Intelligence, Workflows and Administration.
- A bounded full-screen intelligence map with compact search, layer controls and viewport-safe drawers.
- English-first place labels with local names shown second where available.
- Six coordinated themes covering the shell, map, tables, forms, cards and analytical workspaces.
- Responsive desktop, laptop, tablet and mobile layouts.
- Accessible focus states, keyboard navigation, onboarding and reduced-motion support.
- Non-blocking startup: local catalogue and cached data open immediately while optional live systems initialise in the background.
- One self-contained production browser bundle, avoiding fragile multi-module startup chains on hosted deployments.

## Product principles

- The map remains the primary working surface.
- Shipping intelligence is exposed through map layers, route analysis and contextual drawers rather than a standalone navigation tab.
- Earthquakes are shown only when they meet a material-impact policy covering major magnitude, population exposure, infrastructure, ports, chokepoints or national disruption.
- Core public feeds warm automatically without mandatory API keys. Static catalogues, cached snapshots and configured connectors remain labelled separately.
- Every map entity is expected to open a usable detail surface.
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

On Render, Merlin can derive `PUBLIC_ORIGIN` from Render's supplied external URL or hostname when the explicit variable is absent. The startup readiness gate still refuses unsafe production placeholders. Public-first live-data services persist their last successful snapshots. ReliefWeb, ACLED, X and licensed global AIS remain optional because their providers require approved application identifiers, credentials or commercial access.

## Verification

```bash
npm test
npm run verify:part20
npm run browser:part20
npm run security:scan
npm run lines
```

The complete repository is delivered in exactly 20 numbered GitHub upload ZIPs. Every ZIP contains fewer than 100 files and preserves repository-relative paths. Extract each ZIP and upload its contents into the same GitHub repository in numerical order.

## Release documentation

- `docs/release/V22-AESTHETIC-REBUILD.md`
- `docs/release/PART-20-ACCEPTANCE.md`
- `docs/PART-19-LIVE-DATA.md`
- `docs/release/V20-PARTS.md`
