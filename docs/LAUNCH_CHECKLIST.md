# Launch Checklist

## Render

- Confirm Render uses Node 20.
- Confirm build command is `npm install --package-lock=false --no-audit --no-fund`.
- Confirm start command is `npm start`.
- Confirm `/health` returns `ok: true`.
- Confirm `/api/sources` returns the source catalogue.
- Confirm `/api/brief` returns feed counts without server errors.

## Map

- App opens directly to the map.
- Search for `London`, click a result, and confirm the country card opens.
- Search for `New York`, click a result, and confirm missing local crime is shown as `N/A`.
- Zoom into a city and confirm OSM town/facility dots appear.
- Click a town/city dot and confirm Wikipedia enrichment attempts to load.

## Data Honesty

- Disconnecting a feed must show `N/A` or an unavailable status.
- No generated prices should appear.
- No generated chart lines should appear.
- No generated Polymarket fallback rows should appear.
- No static route or monitor point should appear as a live event.

## Panels

- Live Brief shows measured market moves, event counts and source-linked events.
- Crypto charts have labelled time and price axes.
- Commodity charts have labelled time and price axes.
- Rapid Movers shows measured candle moves only.
- Routes are off by default.
- Safety/conflict colour comes from country polygons.
- Only one side panel/drawer is open at a time.

## Optional Tokens

- Add `UCDP_TOKEN` only if you want UCDP conflict rows.
- Add `X_BEARER_TOKEN` only if you want official X API ingestion.
- Do not add fake replacement data for missing optional feeds.
