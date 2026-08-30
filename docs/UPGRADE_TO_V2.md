# Upgrade current deployed MERLIN to V2

## GitHub Desktop

1. Keep `legacy-v25` untouched.
2. Switch to `main`.
3. Extract the supplied V2 ZIP.
4. In GitHub Desktop choose `Repository` → `Show in Explorer`.
5. Copy all files and folders from inside the extracted V2 folder into the repository root.
6. Choose Replace when Windows asks about matching files.
7. Return to GitHub Desktop and review the changes.
8. Commit: `MERLIN CNC V2 operations rebuild`.
9. Push origin.

## Render

The push should trigger the existing Render service automatically.

The repository contains `.node-version` set to `20.19.5` and `package.json` also pins Node 20.19.5.

### Critical persistence check

SQLite and uploaded DXFs must be stored on persistent storage. If using a Render persistent disk mounted at `/var/data`, set:

- `MERLIN_DB_PATH=/var/data/merlin.sqlite`
- `MERLIN_PRODUCT_DIR=/var/data/products`
- `MERLIN_UPLOAD_DIR=/var/data/uploads`
- `MERLIN_PREVIEW_DIR=/var/data/previews`

Without persistent storage, a deployment can erase the live database/files.

## AI

The rest of MERLIN works without an OpenAI key. Ask MERLIN and automated web research require `OPENAI_API_KEY` on the backend only.
