# Merlin V6

Merlin is a public-source geopolitical and market signal platform designed to answer a practical question: **what changed, where, why does it matter, what could move next, and what should the customer verify or protect against?**

It is deliberately concentrated on Europe, Russia/Eurasia, the Middle East, North America, and strategic Asia (especially China, Taiwan, Japan and the Koreas). World coverage remains available, but collection depth and scenario logic are weighted toward those regions.

Merlin does **not** intercept communications and does not perform unauthorized SIGINT. Its signal layer is built from lawful public and open sources: official defence and government releases, sanctions authorities, maritime advisories, public cyber advisories, nuclear monitoring, energy and central-bank information, serious reporting, GDELT discovery, public market data and prediction-market context.

## Collection and filtering

The repository currently defines **106 configured collection streams**:

- 50 region/topic-specific GDELT discovery streams
- 56 direct public-source adapters/feeds
- defence and force-posture releases
- maritime warnings and incident reporting
- sanctions and export-control authorities
- nuclear monitoring
- cyber and critical-infrastructure advisories
- energy and macro policy sources
- serious global/business reporting
- market and prediction-market context

The source policy contains 100 curated domain rules. Tabloid and low-quality domains are blocked or heavily discounted. State-controlled sources may be retained for signalling what a government is saying, but disputed factual claims receive lower evidentiary weight until independently corroborated.

## Analysis pipeline

Incoming records pass through:

1. freshness and source-quality gates
2. geography and priority-region routing
3. event taxonomy and materiality checks
4. duplicate removal and story clustering
5. corroboration and claim-risk scoring
6. public-indicator matching (observable defence, maritime, sanctions, cyber, energy, nuclear, finance and infrastructure changes)
7. escalation/de-escalation analysis
8. institution linking
9. market-transmission modelling
10. exposure and cross-border dependency mapping
11. scenario/playbook matching
12. prediction-market context (sentiment only, never treated as factual proof)
13. verification/follow-up planning
14. change detection against the previous snapshot

The product contains 70 event definitions, 60 claim-risk rules, 46 escalation indicators, 45+ public observable-signal indicators, 32 market-transmission models, 32 decision playbooks, 46 cross-border dependency paths and 80 priority-country profiles.

## Customer interface

The customer-facing application stays narrow:

- **Live Map** — filtered current signals, major ports, strategic locations and shipping routes
- **Opportunities** — current developments with a defined market-transmission path; setup score is not a return probability
- **Markets** — current market values and the signals most plausibly linked to them
- **Conflicts** — military/escalation events passing the filter
- **Countries** — priority coverage, active signals and exposures
- **Daily Brief** — a concise decision-oriented current summary
- **Source coverage drawer** — health and item counts grouped by defence, sanctions, maritime, cyber, markets, energy, nuclear, policy, humanitarian, discovery and reporting lanes

Opening a signal exposes evidence grade, confidence, source count, public indicators detected, scenarios, escalation indicators, market transmission, exposures, supply/dependency links, organisations to follow, practical checks, prediction-market context, verification notes and source links.

## Map

Production uses MapLibre GL JS with OpenFreeMap vector cartography, so coastlines, borders and labels remain sharp through continuous zoom. An Esri satellite option is available. A bundled Natural Earth relief map is used as a resilient local basemap when external tiles cannot load; it is a real product fallback, not a generated mock-up.

## Run locally

Node.js 20+:

```bash
npm install
npm start
```

Deterministic demo/acceptance mode:

```bash
MERLIN_FIXTURE_MODE=true npm start
```

The demo dataset is explicitly labelled in the interface and must not be presented as live reporting.

### Optional configuration

`RELIEFWEB_APPNAME` must be set to a ReliefWeb-approved application name before that adapter can work. Other optional keys are documented in `.env.example`.

## Verification

```bash
npm test
npm run verify
npm run browser:test
npm run lines
```

The browser integration test executes the actual customer JavaScript in Chromium. External vector tiles are replaced by a deterministic MapLibre-compatible harness in the isolated test environment, while the separate screenshot test renders the actual bundled Natural Earth fallback. Production third-party connectivity must still be confirmed after deployment.

## Product integrity

Merlin does not insert fabricated live headlines when upstream sources fail. Source failures are exposed. A last-valid snapshot may be retained through a temporary outage, with freshness visible to the customer. Prediction markets are context, not evidence. Market and security outputs are structured decision support, not guarantees.

## V7 dark-blue map system

V7 keeps the V6 public-source collection and analysis pipeline and replaces the cartographic presentation layer. The default map is a bundled high-resolution dark-blue physical relief tile set so the dashboard remains visually complete without a third-party map provider. MapLibre GL renders the production map when the pinned dependency is installed; the same event, port, strategic-node, city-light and shipping-route data is then drawn as native map layers.

Map controls expose separate toggles for current signals, conflict, political risk, sanctions, shipping disruption, energy, cyber/infrastructure, market stress, supply-chain pressure, air/maritime alerts, signal heat, strategic nodes, ports, routes and labels. Satellite remains optional.

The bundled local map is intentionally part of the customer product, not a placeholder. It uses a dark navy physical-relief base, subtle coordinate grid, coast/border detailing and an independent overlay renderer. Current-event data is never fabricated when live sources are unavailable; `MERLIN_FIXTURE_MODE=true` is only for deterministic product demonstrations and tests and is visibly labelled in the UI.
