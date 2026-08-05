# Production acceptance checklist

1. Upload Parts 01–18 in numerical order and permit replacement of matching paths.
2. Install Node.js 20 or later and run `npm install` when dependencies are declared.
3. Copy `.env.example` to the deployment secret manager; never commit live credentials.
4. Run `npm run validate:env`, `npm test`, `npm run security:scan`, `npm run verify:part18`, and `npm run acceptance:final`.
5. Confirm the map is bounded, search is collapsible, English/local labels render, popovers scroll, themes apply to map and shell, all visible entities are interactive, shipping is map-only, and only materially disruptive earthquakes are surfaced.
6. Configure real connectors. Unconfigured connectors must remain labelled unavailable; do not substitute fabricated live records.
7. Record a verified backup, migration dry run, rollback test, monitoring readiness, support handover and release approval before production deployment.
