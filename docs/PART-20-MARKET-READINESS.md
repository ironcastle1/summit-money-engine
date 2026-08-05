# Merlin V20 Part 20 — Market Readiness

Part 20 is the final customer-interface and acceptance layer. It does not replace the intelligence, logistics, market, country-risk, conflict, publishing, commercial, security or operations systems delivered in Parts 1–19. It makes those systems coherent and verifiable in the shipped browser application.

## Customer-facing additions

- Six whole-product themes that also alter map presentation.
- Responsive navigation for mobile, tablet, laptop, desktop and ultrawide displays.
- First-run product guide and replayable help flow.
- Keyboard shortcuts, skip navigation, focus trapping and visible focus treatment.
- Offline, cached-data and recovery notices.
- Clearly labelled demonstration mode with operational safeguards.
- Client error capture and performance measurements.
- Material-event filtering that excludes routine earthquakes.
- Viewport-safe drawers and scrollable information panels.
- Compact map search and map-only shipping controls.

## Acceptance evidence

The rendered Chromium suite loads the real shipped HTML, CSS and browser bundle and exercises the cumulative server contracts. It verifies six viewport profiles, all main workspaces on desktop-class displays, map startup, search, layers, themes, drawers, onboarding, offline recovery, accessibility naming, navigation and the absence of browser errors.

Browser evidence is retained under `docs/part20-browser-evidence/`.

## Browser matrix

Chromium is executed in the build environment. Firefox and Safari/WebKit remain declared target engines and are covered by standards-compatible source contracts, but those browser binaries were not available in the build container. They should be added to the hosted CI matrix when those runners are available.

## Release rule

A Part 20 release is blocked when any required rendered viewport, customer journey, security scan, product test, material-event rule or static import check fails.
