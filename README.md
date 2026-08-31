# MERLIN CNC V5 — Deterministic CNC Business Operating System

MERLIN V5 is a practical operating system for the current CNC plasma business. It has **no chatbot, no local language model, no OpenAI integration, no API-token bill and no model download**.

The system is built around four jobs:

1. **Tell MERLIN** — type a concrete business statement once; MERLIN parses it with deterministic rules, shows exactly what it understood, and only writes it after confirmation.
2. **Business operations** — orders, production, inventory, finished stock, finance and activity history.
3. **Product/DXF registry** — every DXF receives a permanent MER product number and its own product folder; revisions, previews, photos and documents stay attached to that product.
4. **Market opportunity watch** — scheduled public-web collectors gather current product, price, supplier and trend evidence. MERLIN produces factual evidence summaries without invented opportunity scores.

## Quick installation

### Existing GitHub/Render installation

1. Preserve the old branch if you want it.
2. Extract the V5 GitHub-root ZIP.
3. Copy **the contents** directly into the existing repository root and replace existing files.
4. Commit and push to `main`.
5. Render redeploys automatically if connected to the repository.
6. Keep a persistent Render disk mounted at `/var/data` with the environment variables in `render.yaml` so the SQLite database and uploaded product files survive redeploys.

No API key is required.

### Run on Windows instead

1. Install Node.js 20 if it is not already installed.
2. Double-click `SETUP_MERLIN.bat` once.
3. Double-click `START_MERLIN.bat` whenever you want MERLIN running.
4. Open `http://localhost:3000`.

## Tell MERLIN

The intake console is not a chatbot. It is a structured parser.

Examples:

```text
Bought 5 sheets of 2mm cold-reduced steel 500x500mm for £110 delivered
```

MERLIN extracts:

- action: raw-material purchase
- quantity: 5 sheets
- thickness: 2 mm
- width/height: 500 × 500 mm
- total purchase cost: £110
- unit cost: £22/sheet

It shows those fields before recording them.

Other supported statements include:

```text
Bought 50 standoffs for £22.50
I have 8 plasma electrodes left
Spent £13.50 on black paint
Sold MER-WALLART-000001 for £65 on Etsy
New order for MER-WALLART-000001, qty 2, £60 each, due 2026-09-05
Cut 2 of MER-WALLART-000001; cutting 14 min, cleanup 8 min
Set MER-WALLART-000001 selling price £75
Note: black paint takes longer to cure when the garage is cold
```

If a statement is ambiguous, MERLIN does **not** guess. It marks the missing field and does not write the record.

## Product IDs and files

A new DXF creates a permanent product such as:

```text
MER-WALLART-000001
```

with a folder such as:

```text
data/products/MER-WALLART-000001/
├── master/
├── revisions/
├── previews/
├── photos/
├── listings/
├── production/
├── costing/
├── documents/
├── assets/
└── product.json
```

The product ID does not change when the product name changes.

From the product detail window you can:

- add a new DXF revision;
- confirm DXF units;
- attach photographs;
- attach listing copy/documents;
- attach production/costing files;
- record the BOM;
- record production runs;
- set material, physical target size and selling price.

Non-DXF product files are stored in the correct product folder and recorded in the `product_assets` table.

## DXF discipline

MERLIN uses deterministic DXF parsing for supported entity types. It records source units, extents, entity count, open paths, cut length where calculable, obvious duplicates and source-scale machine fit when units are known.

It does **not** call arbitrary image-to-DXF conversion production-ready. That endpoint remains disabled until a pipeline can prove a better outcome rate and CNC topology safety.

It also does not invent minimum bridge/hole/slot limits before those rules have been calibrated from real cuts on the actual machine.

## Inventory

Inventory distinguishes:

- raw material;
- offcuts;
- consumables;
- hardware;
- packaging;
- finished products;
- other tracked items.

Each item can hold quantity on hand, reserved quantity, available quantity, reorder point, unit cost, supplier, location and material dimensions/attributes.

Inventory changes are written to an immutable movement ledger. Production can consume material/BOM inputs and create finished stock. Dispatch can consume finished stock.

## Orders and production

Order stages currently include:

```text
new
confirmed
queued
cutting
deburring
surface_prep
painting
curing
qc
packing
ready
dispatched
cancelled
```

The dashboard shows open orders and the production queue immediately.

## Market Opportunity Watch

MERLIN's research layer does not ask a language model what is trending.

Scheduled collectors gather current public evidence using configured search/news/trend sources. The database stores:

- query;
- title;
- source URL;
- publisher;
- snippet;
- observed public price when parsable;
- publication date when available;
- collection time.

V5 then groups that evidence deterministically and reports:

- how many current results were collected;
- how many distinct domains were represented;
- whether direct price evidence was present and its observed range;
- any dated recent sources;
- why the monitored category is relevant to the **current** business;
- explicit unknowns;
- source links;
- a small validation action.

Search presence is never presented as proof of sales. No fabricated percentages, confidence ratings or opportunity scores are generated.

The opportunity panel is ordered transparently: observations with direct price evidence first, then multi-domain evidence, then recency. That ordering is not an invented profitability score.

## Current-stage doctrine

MERLIN models the business that exists now. The seeded state contains the current CrossFire/Razorweld operation and current product strategy. It does not fill the operating dashboard with hypothetical Prague, Gulf, multi-factory or future-machine assumptions.

When the physical business changes, update the capability/machine state and then extend MERLIN around the new reality.

## Data storage

Default local paths:

```text
data/merlin.sqlite
data/products/
data/uploads/
data/previews/
```

Render should use:

```text
MERLIN_DB_PATH=/var/data/merlin.sqlite
MERLIN_PRODUCT_DIR=/var/data/products
MERLIN_UPLOAD_DIR=/var/data/uploads
MERLIN_PREVIEW_DIR=/var/data/previews
```

and a persistent disk mounted at `/var/data`.

## Security

V5 contains no AI secret/API key. If the deployment is made publicly accessible, add authentication before entering customer-identifying or commercially sensitive information. The current application is intended as an owner-operated internal business system.

## Tests

Run:

```bash
npm install
npm run check
npm test
```

GitHub Actions runs the same syntax/test workflow on pushes and pull requests.
