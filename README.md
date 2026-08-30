# MERLIN — CNC Business Operating System

MERLIN has been repurposed into an AI-directed operating system for the current CNC plasma business.

This build is deliberately **current-state-first**. It does not pretend the business already owns future machines, factories, staff or overseas operations. MERLIN records the real operation, watches evidence, remembers everything entered into the system, and raises software-evolution requests when the physical business genuinely changes.

## Core doctrine

- No fabricated opportunity scores.
- No invented market numbers.
- No invented CNC limits.
- Direct facts, sourced evidence, derived calculations and unknowns must remain distinguishable.
- The database is the business memory; the LLM is the reasoning/interface layer.
- DXFs are ingested into formal product records with immutable product and revision IDs.
- A parsed DXF is **not** automatically production-ready.
- Inventory is transaction-based: raw metal, consumables, packaging, hardware, offcuts and finished stock.
- Future expansion capability is added only after the owner reports a real upgrade.

## What V1 already does

1. Stores the current machine/capability state.
2. Gives every product an immutable MERLIN product ID and human-readable product code.
3. Ingests uploaded DXF files into a managed product folder.
4. Stores file hash, revision, dimensions, path count data and actual geometry-derived SVG preview.
5. Detects several deterministic DXF problems: unmatched/open endpoints, duplicate entities, unsupported entity types, machine-envelope overflow and configured-too-small circles.
6. Explicitly flags geometry areas it cannot yet prove, rather than inventing a pass.
7. Tracks inventory and stock movements.
8. Tracks product costs, production runs and sales events.
9. Stores durable owner-supplied business facts.
10. Embeds an OpenAI-powered MERLIN chat layer capable of writing supplied facts into the database through controlled tools.
11. Uses OpenAI web search for evidence-based current-market research.
12. Stores market observations with direct evidence, supporting evidence, unknowns and sources—no scores.
13. Keeps a capability registry and creates software-upgrade requests when the real business changes.
14. Runs as a normal Node backend and can serve its own dashboard.
15. Can also deploy the dashboard to GitHub Pages while the backend runs separately.

## Important image → DXF position

`POST /api/design/from-image` intentionally returns **501 Not Implemented**.

MERLIN V1 does **not** claim it can turn an arbitrary image into a production-safe plasma DXF. A future version can add a staged computer-vision/vector/topology/CNC pipeline, but it should only be enabled after objective validation against real designs and test cuts. This is intentional, not missing polish.

---

# 1. Install locally

Requirements:

- Node.js 20+
- npm
- Git
- OpenAI API key only if you want Ask MERLIN / live market research

Clone or extract the repository, then:

```bash
npm install
cp .env.example .env
npm run seed
npm start
```

Open:

```text
http://localhost:3000
```

The first run creates:

```text
data/merlin.sqlite
```

and the current business seed.

## Configure `.env`

Minimum local setup:

```env
PORT=3000
MERLIN_DB_PATH=./data/merlin.sqlite
MERLIN_UPLOAD_DIR=./data/uploads
MERLIN_PRODUCT_DIR=./data/products
MERLIN_PREVIEW_DIR=./data/previews
MERLIN_PUBLIC_DIR=./public
OPENAI_API_KEY=YOUR_KEY_HERE
OPENAI_MODEL=gpt-5.6-terra
MERLIN_AUTOMATION_TOKEN=CHOOSE_A_LONG_RANDOM_SECRET
MERLIN_ALLOWED_ORIGINS=http://localhost:3000
```

Do **not** commit `.env`.

---

# 2. Product ingestion

Open the dashboard and use **Ingest DXF**.

For each new DXF MERLIN creates an ID such as:

```text
PROD-<UUID>
```

and a readable product code such as:

```text
MER-WALLART-000001
```

It then builds:

```text
data/products/MER-WALLART-000001/
├── master/
│   └── R1_original-file.dxf
├── revisions/
├── previews/
│   └── MER-WALLART-000001_R1.svg
├── photos/
├── listings/
├── production/
├── costing/
└── product.json
```

`product.json` is an export/snapshot convenience. SQLite remains the authoritative record.

### DXF validation status

New uploads normally become either:

- `failed` — deterministic blocking fault found, e.g. outside table or open geometry.
- `review_required` — no proven blocking fault, but manual/topological/CNC calibration review remains.

MERLIN does not silently promote a file to `validated`.

The owner can explicitly validate a revision after review/test cutting through the API; the UI can be expanded with that control next.

---

# 3. Inventory

Use the dashboard to create stock items or tell MERLIN conversationally.

Example inventory kinds:

- `raw_material`
- `consumable`
- `packaging`
- `hardware`
- `finished_product`
- `offcut`
- `other`

Every stock change should eventually be a movement:

- purchase
- consume
- adjust
- reserve
- release
- produce
- scrap
- return

This creates a historical ledger rather than a single editable quantity with no explanation.

### API example

Create an item:

```bash
curl -X POST http://localhost:3000/api/inventory \
  -H 'Content-Type: application/json' \
  -d '{
    "kind":"raw_material",
    "name":"1.5 mm mild steel 500x500",
    "unit":"sheet",
    "quantity_on_hand":10,
    "unit_cost":18,
    "currency":"GBP"
  }'
```

Record consumption:

```bash
curl -X POST http://localhost:3000/api/inventory/movements \
  -H 'Content-Type: application/json' \
  -d '{
    "inventory_item_id":"INV-...",
    "movement_type":"consume",
    "quantity":1,
    "notes":"Used for test cuts"
  }'
```

---

# 4. Ask MERLIN

With `OPENAI_API_KEY` configured, the dashboard chat can accept statements such as:

```text
I bought 10 sheets for £180 delivered.
```

or:

```text
This product took 6 minutes 40 seconds to cut and 8 minutes to clean.
```

MERLIN has controlled tools for:

- durable memory facts
- inventory item creation
- inventory movements
- production-run recording
- product cost records
- real capability upgrades + software-evolution requests

The assistant prompt explicitly forbids fabricated business numbers and future-state assumptions.

**Important:** V1 is intentionally conservative about write tools. It is better to add a missing field/form than allow the model to infer business truth.

---

# 5. Market intelligence

Live research requires an OpenAI API key and the server-side web-search tool.

Run manually:

```bash
curl -X POST http://localhost:3000/api/market/research \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_MERLIN_AUTOMATION_TOKEN' \
  -d '{"focus":"current product opportunities suitable for the present CNC setup"}'
```

MERLIN stores:

- topic
- observed fact
- why it may matter to the current business
- direct evidence
- supporting evidence
- unknowns
- suggested small validation test
- source URLs

It does **not** store an invented opportunity score.

The research prompt also tells MERLIN not to research hypothetical international expansion unless that capability/stage becomes current.

---

# 6. GitHub Pages + backend

GitHub Pages can host the dashboard, but not the Node API, SQLite database, AI calls or DXF processing.

Recommended architecture:

```text
GitHub repository
├── source code
├── GitHub Actions
└── GitHub Pages dashboard
          │
          ▼
MERLIN Node backend (Render/Fly/VPS/local server)
          │
          ├── SQLite persistent storage
          ├── DXF/product files
          └── OpenAI API
```

## Deploy the frontend to Pages

1. Push this repository to GitHub.
2. Repository → **Settings → Pages**.
3. Source: **GitHub Actions**.
4. Repository → **Settings → Secrets and variables → Actions → Variables**.
5. Create variable:

```text
MERLIN_API_BASE_URL=https://YOUR-BACKEND.example.com
```

6. Run the `Deploy MERLIN Pages` workflow or push to `main`.

The workflow generates `public/config.js` for the Pages deployment without putting the API key in the browser.

Never expose `OPENAI_API_KEY` in GitHub Pages JavaScript.

---

# 7. Deploy the backend to Render

`render.yaml` is included.

The important requirement is **persistent storage**. SQLite and uploaded DXFs cannot live safely on an ephemeral filesystem.

On Render:

1. Create Blueprint / web service from this repo.
2. Use a paid/persistent disk mounted at `/var/data` if using the provided SQLite deployment.
3. Add secrets:

```text
OPENAI_API_KEY
MERLIN_AUTOMATION_TOKEN
MERLIN_ALLOWED_ORIGINS
```

Set allowed origins to your Pages URL, e.g.:

```text
https://YOUR-GITHUB-USERNAME.github.io
```

For larger multi-user/factory use, migrate the data layer from SQLite to PostgreSQL. Do not do that merely for architectural fashion while the current single-user operation does not need it.

---

# 8. Automatic research through GitHub Actions

`.github/workflows/market-research.yml` can call the deployed backend on a schedule.

Create repository secrets:

```text
MERLIN_BACKEND_URL
MERLIN_AUTOMATION_TOKEN
```

The workflow does not scrape sites itself. It asks the backend research service to run source-aware live research and store the results in MERLIN's database.

---

# 9. How MERLIN evolves

The capability registry is intentionally small today.

When the real business changes, tell MERLIN something explicit such as:

```text
I have bought a 4x4 CNC plasma table and it is now operational.
```

The AI should:

1. record the new capability;
2. preserve the old capability/history;
3. create a `system_upgrade_request` describing concrete software changes now justified by reality.

Example consequences might include new machine-envelope rules, larger-sheet inventory, revised nesting support and rechecking previously size-rejected products.

It should **not** preload overseas-factory logic merely because that might happen one day.

---

# 10. V25 migration strategy

See [`docs/MIGRATION_FROM_MERLIN_V25.md`](docs/MIGRATION_FROM_MERLIN_V25.md).

The old V25 manifest describes 1,868 repository files and already contains useful generic infrastructure—API routing, automation, market-intelligence, live-data, reliability, security, UI, publishing and build/deployment machinery. The new repo keeps the same Node/GitHub operational style while discarding domain modules that would contaminate the present CNC operating state.

If the actual V25 ZIP/source repository is later placed next to this project, migrate generic infrastructure selectively; do not re-import the old finance/geopolitical domain simply to preserve line count.

---

# 11. Verification

Run:

```bash
npm run check
npm test
```

The repository includes tests for IDs, inventory ledger behavior and a simple DXF analysis fixture.

---

# Near-term development order

1. Use this V1 with real DXFs and real inventory.
2. Add your first actual material/paint/consumable costs.
3. Feed real cut/cleanup/paint/packaging times.
4. Add marketplace sales ingestion only when real sales begin.
5. Add stronger DXF topology checking based on your actual cut rules.
6. Add BOM consumption and offcut geometry after enough real material flow exists to justify it.
7. Add image→DXF only if a measured validation programme proves it materially better than manual/general-AI conversion.

MERLIN should become sophisticated because the business becomes sophisticated—not because the repository is trying to look sophisticated.
