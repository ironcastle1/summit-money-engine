# Merlin V20 Part 05 — Geospatial and Map Engine

Part 05 replaces the legacy repeating-world map implementation with a bounded, modular Web Mercator runtime shared by browser and server services.

## User-facing changes

- The world cannot repeat horizontally when zoomed out.
- Minimum zoom adapts to the viewport so the map remains inside its frame.
- Search is collapsed behind a magnifying-glass control until opened.
- Place labels render the English name first and the local name beneath it.
- Map drawers and detail panels remain inside the viewport and scroll independently.
- Shipping remains available through port and route layers, but no longer occupies a separate navigation workspace.
- Routine earthquakes are removed from the client map feed; material, high-magnitude, tsunami, infrastructure and shipping-impact events remain eligible.
- Every rendered entity is registered with a stable identifier and selection callback.
- Keyboard, pointer, wheel, touch and resize controls share the same bounded viewport model.

## Server capabilities

The map platform API exposes the layer catalogue, diagnostics, search, bounded viewport fitting, layer feature queries and authenticated saved views. Static catalogue data is identified as static reference data rather than presented as live intelligence.

## Principal endpoints

- `GET /api/map/platform`
- `GET /api/map/layers`
- `GET /api/map/diagnostics`
- `GET /api/map/search`
- `GET /api/map/features/:layerId`
- `POST /api/map/fit`
- `GET /api/map/saved-views`
- `POST /api/map/saved-views`
- `POST /api/map/saved-views/delete`

## Verification

Part 05 is checked through dedicated coordinate, projection, viewport, GeoJSON, clustering, labels, route, spatial-index, saved-view, browser-contract and application integration tests. The complete merged repository test suite must also pass before packaging.
