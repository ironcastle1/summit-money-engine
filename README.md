# MERLIN CNC V6 — Product-Centred CNC Business Operating System

MERLIN V6 is the current-stage operating system for the CNC plasma business. It is deliberately centred on the information that matters now: **products, DXFs, inventory, market evidence, completed sales/performance, finance and business history**.

There is no chatbot, no OpenAI API, no local language model and no token billing. `Tell MERLIN` is a deterministic intake parser: it extracts concrete fields, shows them to the owner, and writes nothing until the owner confirms the parsed record.

## What changed in V6

- Open-order and production-queue UI removed. Customer platforms remain the place where live orders are fulfilled.
- Completed sales are recorded after fulfilment for performance tracking.
- Product IDs are short workshop codes such as `JOK-001`, `NAP-002` and `MHN-003`.
- Existing long V5 product codes are migrated automatically on startup without changing their internal UUIDs.
- Every DXF upload creates one permanent product row and one immutable internal product ID.
- New DXFs can be added as revisions to an existing product rather than creating duplicates.
- Product table shows all products together with short ID, title, category, material, production size, active revision, deterministic DXF findings, average cut time, units sold and revenue.
- `Analyse selected` and `Analyse all DXFs` re-run deterministic analysis from the stored source files.
- Vague `Review Required` badges are removed from the product table. MERLIN shows only concrete findings such as `Units unknown`, `4 open endpoints`, `2 unsupported entities`, `duplicate geometry`, or `exceeds table envelope`.
- Metal, consumables, hardware, packaging, finished stock and offcuts are combined in a single Inventory section with view toggles.
- Dashboard sections use pointer-based drag reordering and save the resulting order in SQLite.
- Market intelligence remains evidence-first and score-free.

## GitHub / Render upgrade

1. Preserve any branch you want to keep.
2. Extract the V6 GitHub-root ZIP.
3. Copy the **contents** into the root of the existing `summit-money-engine` repository.
4. Replace matching files.
5. Commit to `main`, for example: `MERLIN CNC V6 product-centred rebuild`.
6. Push origin. Render can redeploy automatically.

Do not place the extracted V6 folder inside the repository as an extra nested directory. `package.json`, `server.js`, `public/`, `src/`, etc. should remain at repository root.

## Existing data

V6 migrates an existing MERLIN SQLite database in place. It does not require deleting the database. Products continue to use their immutable internal UUIDs even when the visible workshop code changes from an old long form such as `MER-WALLART-000001` to a short form such as `JOK-001`.

The old orders tables remain in the database for backward data preservation, but V6 does not expose an open-order workflow in the main application.

## Main workflow

### 1. Upload DXFs

Upload one or many `.dxf` files in Products. A new file becomes a new product line unless its SHA-256 hash exactly matches a DXF already stored.

Example:

```text
JOK-001  Joker
NAP-002  Napoleon
MHN-003  Modern House Numbers
```

The short code is visible and writable in the workshop. The database still holds a separate immutable UUID internally.

### 2. Review product analysis

MERLIN analyses actual vector geometry. It can report deterministic facts such as:

- drawing extents;
- confirmed physical dimensions when units are known;
- entity count;
- unmatched/open endpoints;
- duplicate entities;
- unsupported entity types;
- whether confirmed dimensions fit the active table envelope;
- approximate cut length and pierce information where deterministically available.

It does **not** claim that generic DXF topology alone proves retained steel, bridge integrity or complete plasma cuttability.

### 3. Record stock

Use the unified Inventory section or Tell MERLIN.

Example:

```text
Bought 5 sheets of 2mm cold-reduced steel 500 x 500mm for £110
```

MERLIN parses the statement and presents the extracted quantity, thickness, dimensions and costs before recording it.

### 4. Record completed production data

Open a product and record measured cutting, cleanup, finishing and packaging times after a real run. These measurements feed product performance rather than relying on estimates.

Tell MERLIN also accepts examples such as:

```text
Cut JOK-001; cutting 14 min, cleanup 8 min
```

### 5. Record completed sales

V6 deliberately does not require you to log an order before fulfilling it. After the sale is completed, record it against the product:

```text
Sold JOK-001 for £65 on Etsy
```

The Products and Sales & Product Performance tables then update units sold and revenue.

## Product files

A product folder is organised under:

```text
data/products/JOK-001/
  master/
  revisions/
  previews/
  photos/
  listings/
  production/
  costing/
  documents/
  assets/
  product.json
```

The visible code can be corrected from the product record. MERLIN attempts to move the product folder and update stored paths when a code changes. The immutable UUID remains unchanged.

## Inventory views

One Inventory section supports:

- All
- Metal
- Consumables
- Hardware
- Packaging
- Finished
- Offcuts
- Other

Each record can carry quantity, unit, cost, reorder point, dimensions/specification and location.

## Market intelligence

MERLIN’s collectors gather public web evidence for monitored current-stage product and procurement topics. Evidence summaries state:

- what was actually collected;
- why it may be relevant to the present CNC operation;
- what the evidence does not establish;
- source links;
- a possible small validation action.

No opportunity scores, confidence percentages or fabricated sales estimates are generated.

## Tell MERLIN

Tell MERLIN is not a chatbot. It recognises supported concrete business statements. It can currently process categories including:

- metal purchases;
- supply/consumable purchases;
- stocktakes for recognised supplies;
- expenses;
- completed sales;
- completed production runs;
- product selling-price changes;
- explicit business notes.

An open-order statement is deliberately rejected with an explanation that V6 records completed sale/production history instead.

## Local development

```powershell
npm install
npm run seed
npm start
```

Then open:

```text
http://localhost:3000
```

## Persistence on Render

SQLite and product files require persistent storage. Configure `MERLIN_DB_PATH` and `MERLIN_DATA_DIR` / `MERLIN_PRODUCT_DIR` to point to a persistent Render disk if the service is hosted there. Do not rely on an ephemeral filesystem for real business records.

## Security

MERLIN contains business records and potentially commercially sensitive files. If exposed beyond the owner’s private use, add authentication and appropriate access controls before storing customer-identifying information.
