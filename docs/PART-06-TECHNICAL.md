# Part 6 Technical Notes — Country and City Intelligence

## Runtime boundary

Part 6 adds a separate intelligence subsystem. Static catalogue metadata and live measurements are never represented as the same thing.

Static catalogue:

- 232 country and territory records.
- 259 capital and major-city records.
- ISO codes, aliases, centroids, capitals, currencies, languages, time zones, borders, area and baseline population.

Live or periodically refreshed evidence:

- World Bank country indicators.
- UK Police street-level crime for supported UK coordinates.
- ReliefWeb humanitarian reports when a pre-approved application name is configured.
- Google Civic election records when an API key is configured.
- Existing event sources for conflict and disasters.
- Existing verified-news sources for corroborated local and national reporting.

## Failure behaviour

- A source without credentials is `NOT_CONFIGURED`.
- A source outside its geographic coverage is `UNSUPPORTED`.
- A failed source is `OFFLINE` or `DEGRADED` when stale cache is used.
- Missing crime, election or economic readings remain `null` and render as `N/A`.
- Composite risk reweights only available components and publishes coverage and confidence.

## Risk calculations

Conflict and disaster scores use severity, recency decay and evidence count. The score is bounded to 0–100 and does not convert static country metadata into current risk.

Crime scoring uses provider category counts and category-specific severity weights. It is currently enabled only for coordinates supported by the UK Police API.

Election proximity is based on days until the next provider-returned election. No static global election calendar is presented as live data.

Economic stress uses the latest available World Bank inflation and unemployment observations. Every raw indicator retains its source year.

Composite safety risk uses weighted available components:

- Conflict: 34%
- Disaster: 20%
- Crime: 24%
- Verified-news risk: 12%
- Election proximity: 10%

Weights are renormalised when components are unavailable. Coverage percentage and confidence are returned with every composite score.

## API routes

- `GET /api/intelligence/catalog`
- `GET /api/intelligence/sources`
- `GET /api/intelligence/overview`
- `GET /api/intelligence/country`
- `GET /api/intelligence/city`
- `GET /api/intelligence/point`
- `GET /api/intelligence/crime`
- `GET /api/intelligence/elections`

## Interface

The `PLACES` workspace provides:

- Country and city search.
- Region filtering.
- 24-hour to 30-day evidence windows.
- Composite, conflict, disaster, crime, election and economic map layers.
- Country rankings with separate scores and confidence.
- Capital and major-city selection.
- Country and city drill-downs.
- Raw indicator years.
- Crime category counts and shares.
- Event and news evidence lists.
- Source state and record counts.
- JSON export.
