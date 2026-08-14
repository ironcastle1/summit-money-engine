# Deployment

## Render

The included `render.yaml` runs `node server.js` on the port supplied by Render. The application begins serving the labelled build snapshot immediately, then refreshes live public sources asynchronously.

Useful environment variables:

- `MERLIN_REFRESH_MS` — refresh interval; default 300000 ms.
- `MERLIN_SOURCE_TIMEOUT_MS` — individual upstream deadline; default 5000 ms.
- `MERLIN_SOURCE_CONCURRENCY` — concurrent source workers; default 12.
- `MERLIN_CURRENT_WINDOW_HOURS` — analysis retention window; default 168 hours.
- `MERLIN_RUNTIME_DIR` — last-known-good runtime snapshot directory.
- `MERLIN_DISABLE_LIVE=1` — deterministic/offline mode for verification only.

Do not set `MERLIN_DISABLE_LIVE` in the customer deployment.
