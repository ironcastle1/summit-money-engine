# MERLIN CNC Business OS — V2

MERLIN V2 is the current-stage operating system for the CNC plasma business. It deliberately focuses on the operation that exists now rather than filling the software with speculative future factories or expansion plans.

## What changed in V2

The home screen is now an operating dashboard rather than a presentation page. It prioritises:

- open customer orders and due dates
- production stage / queue
- raw metal and offcuts
- consumables, hardware and packaging
- finished stock with physical / reserved / available quantities
- low-stock warnings based only on recorded reorder levels
- recorded monthly revenue and expenses
- recent production and sales
- product/DXF registry
- recent business activity
- evidence-first market observations
- MERLIN AI in a drawer rather than occupying the dashboard

No opportunity scores or fabricated confidence numbers are used.

## DXF handling

Each uploaded DXF creates:

- immutable internal product UUID
- human product number such as `MER-WALLART-000001`
- R1 source file
- geometry-derived SVG preview
- product folder and `product.json` snapshot
- parsed geometry facts and validation issues

DXF units are handled conservatively. If the file does not establish units, MERLIN records drawing-unit extents and leaves millimetre dimensions blank until the owner confirms the unit. MERLIN also separates **DXF source size** from **production target size**, because a source design may be deliberately resized before cutting.

MERLIN does not claim arbitrary image-to-production-DXF conversion is reliable. That endpoint remains disabled until a specialised pipeline can meet the cut-ready standard.

## Requirements

- Node.js 20.19.5
- Render or another persistent Node host for the backend
- persistent storage for SQLite and uploaded product files
- optional OpenAI API key for Ask MERLIN and web research

The default AI model is `gpt-5.6-terra`. Change `OPENAI_MODEL` if desired.

## Replace the current GitHub `main` with this build

Your old MERLIN is already preserved on the `legacy-v25` branch. Keep that branch.

1. Download and extract the V2 ZIP.
2. In GitHub Desktop, make sure the current branch is `main`.
3. `Repository` → `Show in Explorer`.
4. Copy **everything inside the extracted MERLIN_CNC_V2 folder** into the root of the existing `summit-money-engine` folder and allow Windows to replace matching files.
5. Do not delete the hidden `.git` folder.
6. Return to GitHub Desktop.
7. Commit with `MERLIN CNC V2 operations rebuild`.
8. Push origin.
9. Render should redeploy automatically.

You do not need to delete the whole repository first. This ZIP contains the full active V2 codebase; copying it over the root replaces the files that matter. Old V25 files that are no longer in V2 should already have been removed during the V1 takeover. If any old domain folders are still present, remove them from `main` after confirming they are preserved on `legacy-v25`.

## Persistent data warning

MERLIN's memory is only durable if the backend has persistent storage. The intended Render paths are:

- database: `/var/data/merlin.sqlite`
- products: `/var/data/products`
- uploads: `/var/data/uploads`
- previews: `/var/data/previews`

If the current Render service has no persistent disk, data entered into the deployed app can disappear on a redeploy. Fix persistence before relying on MERLIN as the permanent business record.

## Environment variables

Copy `.env.example` to `.env` locally. On Render, configure the same values in the service environment.

```env
PORT=3000
MERLIN_DB_PATH=/var/data/merlin.sqlite
MERLIN_UPLOAD_DIR=/var/data/uploads
MERLIN_PREVIEW_DIR=/var/data/previews
MERLIN_PRODUCT_DIR=/var/data/products
OPENAI_API_KEY=
OPENAI_MODEL=gpt-5.6-terra
MERLIN_AUTOMATION_TOKEN=<secret>
MERLIN_ALLOWED_ORIGINS=
```

Never put `OPENAI_API_KEY` in `public/config.js` or commit it to GitHub.

## Local run

```powershell
npm install
npm run check
npm test
npm start
```

Open `http://localhost:3000`.

## Operating principle

MERLIN stores what is known, shows what needs attention, and leaves unknowns unknown. It evolves when the real business evolves.
