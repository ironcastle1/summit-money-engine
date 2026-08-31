# GitHub / Render implementation — MERLIN V5

MERLIN V5 is a normal Node web application. GitHub stores the code; Render can run the live service. No AI service is required.

## Upgrade existing `main`

1. Make sure the legacy system is preserved on a separate branch if required.
2. Extract the V5 GitHub-root ZIP.
3. Copy every file/folder from the extracted root into the existing repository root.
4. Replace files when Windows asks.
5. Commit: `MERLIN CNC V5 deterministic business OS`.
6. Push `main`.
7. Let Render redeploy.

Do not copy the V5 folder as a nested folder inside the repository.

## Persistent data on Render

The repo contains `render.yaml` for a persistent disk mounted at `/var/data`. Existing Render services created manually should be checked to ensure the same paths are configured. Without persistent storage, SQLite/product uploads can disappear during replacement deployments.
