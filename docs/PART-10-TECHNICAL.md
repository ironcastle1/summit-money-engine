# Part 10 — Country and Political Risk

Part 10 upgrades the existing Places workspace into a country and political-risk operating surface. It combines the existing event, news and country catalogues with explainable risk factors, confidence, evidence coverage, scenarios, comparisons, watchlists, alerts, map features and exports.

## Evidence policy

Every factor carries a state: `MEASURED`, `REFERENCE`, `INFERRED` or `UNAVAILABLE`. Missing live connectors do not generate synthetic current values. Composite scores weight only available factors and publish evidence coverage alongside confidence.

## APIs

The `/api/country-risk` family provides the catalogue, diagnostics, snapshot, country detail, comparison, scenarios, watchlists, alerts and exports. The existing `/api/intelligence` routes remain compatible.

## Browser integration

The Places workspace uses the country-risk controller. Country labels remain English-first with the local name beneath. Country points are interactive and expose risk, confidence, coverage and primary drivers.
