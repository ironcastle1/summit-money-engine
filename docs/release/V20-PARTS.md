# Merlin V20 delivery map

The release is divided by technical ownership so that each package is reviewable, overwrite-safe and below GitHub's 100-file browser-upload ceiling.

1. **Runtime and platform foundation** — root configuration, startup validation, HTTP runtime, security, observability, persistence primitives and foundation checks.
2. **Identity, accounts and billing** — authentication, sessions, subscriptions, entitlements, payments, audit records and account APIs.
3. **Source ingestion framework** — connector contracts, circuit breaking, cache policy, provenance, source health and event ingestion.
4. **News and verification intelligence** — aggregation, claim extraction, deduplication, source comparison, narrative tracking and verification gaps.
5. **Markets and prediction intelligence** — quotes, candles, analytics, probability evidence, market linking and prediction-market integration.
6. **Places, countries and political intelligence** — country/city dossiers, political context, elections, crime, safety and geographic lookup.
7. **Logistics and supply-chain intelligence** — ports, routes, chokepoints, commodities, trade flows, congestion and disruption propagation.
8. **Opportunity and decision engines** — opportunity ranking, action plans, evidence grading, scenario impact and decision audit.
9. **Client application foundation** — boot sequence, state, settings, persistence, API client, commands and fault isolation.
10. **Map engine and interaction tools** — bounded map, non-repeating world, search toggle, bilingual labels, drawers, selection, radius and measurement.
11. **Strategic overlays A** — war, conflict, politics, borders, typography, protests, terrorism, sanctions, elections and humanitarian conditions.
12. **Strategic overlays B** — shipping, ports, chokepoints, infrastructure, pipelines, cables, power, rail, roads, air traffic and supply chains.
13. **Hazard and environmental overlays** — major earthquakes, storms, floods, wildfire, drought, volcanoes, landslides, disease, weather and air quality.
14. **Analytics and correlation workspace** — risk scoring, anomaly detection, event correlation, forecast fusion, narrative velocity and route exposure.
15. **Operational sections and workspaces** — 15 full product sections, navigation, saved views, watchlists, reports and team workspaces.
16. **Automated workflows and reporting** — morning brief, country dossier, route due diligence, port disruption, sanctions change and executive reports.
17. **Design system, themes and responsive UI** — whole-site themes, map styling, charts, panels, accessible interactions and mobile behaviour.
18. **Static catalogues, tests, release tooling and final integration** — data assets, complete test suite, build verification, line audit and final release manifests.

No package is intended to create a parallel application. All parts merge into one repository and one runtime.
