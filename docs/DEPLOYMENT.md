# Deployment

## Render

1. Create a new GitHub repository.
2. Upload the complete Merlin repository.
3. Connect the repository to Render.
4. Render can read the included `render.yaml`.
5. Deploy the Docker service. The Docker build installs the pinned `maplibre-gl` dependency.
6. Confirm `/api/health` returns `ready: true`.
7. Open the customer map and inspect Source Control after the first background refresh.

## Persistent data

Render mounts `/var/data`.

Merlin stores its last successful analysis snapshot there. Temporary source failures therefore do not automatically erase the customer's last usable current picture.

## Environment variables

- `MERLIN_REFRESH_MS` — collection refresh interval
- `MERLIN_SOURCE_TIMEOUT_MS` — per-source timeout
- `MERLIN_MAX_SOURCE_CONCURRENCY` — source concurrency
- `MERLIN_FOLLOWUP_MAX` — maximum adaptive corroboration queries per refresh
- `MERLIN_FOLLOWUP_MIN_SCORE` — minimum event score for adaptive follow-up
- `RELIEFWEB_APPNAME` — ReliefWeb app identifier

## Production check

After deployment verify:

- health endpoint is ready
- source count is populated
- at least some internet sources show `ok`
- map markers appear after the first successful refresh
- opening a marker opens analysis detail
- region filters alter the event set
- source failures are visible rather than hidden

Do not judge live collection from the first few seconds after a cold deploy: collection runs in the background and external sources have independent response times.


## Map verification

The production map loads OpenFreeMap vector styles from `tiles.openfreemap.org`; the optional satellite layer uses Esri World Imagery. After deployment, verify that coastlines and text remain crisp while zooming and that the source-status text does not report map resources unavailable. If those third-party map hosts are blocked by a network policy, Merlin deliberately shows a map-unavailable state rather than a low-quality fallback.
