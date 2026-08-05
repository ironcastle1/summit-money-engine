# Merlin V20 Part 07 — Logistics, Shipping and Route Exposure

Part 07 turns the existing shipping catalogue into an operational route-planning and exposure system while keeping shipping inside the map rather than restoring a separate workspace.

## Delivered

- A directed logistics graph generated from the existing ports, chokepoints and corridor catalogue.
- Fastest, cheapest, lowest-risk, most-reliable and balanced route policies.
- Multiple route alternatives with vessel, cargo, draft and canal compatibility rules.
- Distance, ETA range, reliability, congestion delay, fuel, emissions, insurance and total landed-transport cost estimates.
- Route-corridor event exposure, port and chokepoint risk, sanctions, weather, security and infrastructure models.
- Chokepoint closure scenarios, detours and cascading disruption propagation.
- Network bottleneck ranking, route geofences, saved routes, watchlists and threshold alerts.
- GeoJSON, CSV and compact-summary exports.
- A floating Route Exposure tool on the main map with no standalone Shipping navigation tab.
- Catalogue-only planning by default for immediate responses; live enrichment is explicit so unavailable connectors cannot stall the map.

## API

- `GET /api/logistics/network`
- `GET /api/logistics/diagnostics`
- `GET /api/logistics/bottlenecks`
- `POST /api/logistics/plan`
- `POST /api/logistics/scenario`
- `GET|POST /api/logistics/saved`
- `GET|POST /api/logistics/watchlist`
- `POST /api/logistics/alerts/evaluate`
- `POST /api/logistics/export`

## Data integrity

The platform does not fabricate live vessel positions or port activity. Planning uses the static network catalogue immediately. Live enrichment runs only when explicitly requested and reports connector state separately.
