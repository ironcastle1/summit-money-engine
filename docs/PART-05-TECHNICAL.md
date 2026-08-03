# Part 5 Technical Notes

## Separation of concerns

The shipping layer maintains four distinct data classes:

1. Static catalogue records: port, chokepoint, route and commodity metadata.
2. Operational observations: timestamped source records such as water levels and port activity.
3. External events: normalized Part 1 and Part 4 events correlated by geography, time and text.
4. Derived measurements: risk, exposure, supply impact and confidence calculated from the first three classes.

Static importance is never displayed as current operational evidence. A source that is unavailable remains `NOT_CONFIGURED`, `OFFLINE` or `DEGRADED`.

## Server modules

- `src/domain/shipping/`: schema normalization, geometry, disruption, operational, trade, route and impact calculations.
- `src/shipping-sources/`: source contracts, registry and adapters.
- `src/services/shipping-catalog-service.js`: immutable catalogue and GeoJSON generation.
- `src/services/shipping-intelligence-service.js`: snapshot and entity analysis.
- `src/services/trade-flow-service.js`: Comtrade querying and aggregation.
- `src/services/commodity-shipping-service.js`: commodity-to-network and market correlation.

## Client modules

- `public/shipping/controller.js`: state and API orchestration.
- `public/shipping/map.js`: ports, chokepoints, routes, risk styling and map interaction.
- `public/shipping/table.js`: numerical ranked tables.
- `public/shipping/detail.js`: selected-entity evidence panel.
- `public/shipping/source-strip.js`: source state and freshness display.

## HTTP endpoints

- `GET /api/shipping/catalog`
- `GET /api/shipping/sources`
- `GET /api/shipping/snapshot`
- `GET /api/shipping/port?id=`
- `GET /api/shipping/chokepoint?id=`
- `GET /api/shipping/route?id=`
- `GET /api/shipping/impact?lat=&lon=&radiusKm=`
- `GET /api/shipping/trade?reporterCode=&partnerCode=&flowCode=&commodityCode=&period=`
- `GET /api/shipping/commodity?id=`

## Risk outputs

Risk values are derived from timestamped evidence, distance, severity, source coverage, data age and corroboration. Confidence falls as evidence becomes stale or sparse. Where the minimum evidence threshold is not met, the UI displays `N/A` rather than a default percentage.

## Test coverage

Part 5 adds tests for catalogue normalization, route geometry, chokepoint proximity, event matching, disruption scoring, operational readings, trade aggregation, source health, source parsing, service snapshots and API catalogue/source contracts.
