# MERLIN CNC V4 — Private Local-AI Business Operating System

MERLIN V4 is a local-first operating system for the current CNC plasma business. It keeps the existing product/DXF, orders, inventory, production, finance and evidence systems, but removes paid AI APIs entirely.

## The important change

MERLIN no longer calls OpenAI or any other paid language-model API. The assistant runs against a local model on your own Windows computer through a local model runtime. There is no per-message or per-token bill.

The model is only one component. MERLIN's durable knowledge lives in SQLite and the product/DXF folders. Costs, inventory, orders, measured production times, sales, research evidence and business facts remain structured records even if the AI is stopped.

## Fastest Windows setup

After copying this repository into your GitHub working folder:

1. Commit/push it as normal.
2. In File Explorer, double-click `SETUP_MERLIN.bat` **once**.
3. The script installs Node if necessary, installs the local AI runtime if necessary, installs MERLIN dependencies, selects a model according to RAM, downloads it once, creates `.env`, seeds the database and checks the code.
4. Afterwards use `START_MERLIN.bat`.
5. MERLIN opens at `http://localhost:3000`.

The first local model download can be several GB. That is a one-time download, not token billing.

If you want MERLIN and its market watcher to start automatically whenever Windows starts, double-click `ENABLE_MERLIN_STARTUP.bat` after setup.

## Local model selection

The setup script reads installed RAM and chooses a conservative **base model**:

- up to 8 GB: `qwen2.5:1.5b`
- over 8 GB through 16 GB: `qwen2.5:3b`
- over 16 GB: `qwen2.5:7b`

It then creates a local custom model profile named **`merlin-cnc`** from `config/Modelfile.template`. That profile bakes in MERLIN's evidence discipline, current-stage rule and CNC-business role. The database/tools remain the authoritative memory. You can still switch to another locally installed compatible model from the dashboard if desired. A larger base model can reason better but uses more memory and runs more slowly on CPU-only machines.

## Architecture

```
Browser dashboard (localhost)
        |
Node/Express MERLIN backend
        |
        +-- SQLite business database
        +-- product/DXF file store
        +-- deterministic DXF analysis
        +-- inventory/orders/production/finance
        +-- public-web market collectors
        +-- durable memory/event history
        +-- local AI agent
                 |
                 +-- local model runtime at 127.0.0.1:11434
```

GitHub remains source control and backup for the code. The primary AI-enabled deployment is the local Windows machine because a private local model cannot run inside a static GitHub Page and a normal Render web service cannot access a model that is running privately on your PC.

## Dashboard

The main dashboard shows the operational features directly:

- local MERLIN chat;
- open orders;
- production queue;
- raw metal/offcuts;
- supplies and consumables;
- finished stock;
- market intelligence and raw evidence;
- products/DXFs;
- finance;
- recent activity.

Every major card can be dragged into a different position. Card width can be changed with the `↔` button. Layout is saved in the database.

## Local AI behaviour

MERLIN has tools that can read the live database and, when your message explicitly reports a change, write exact business records. Common structured commands also have a deterministic parser before the model is used. This reduces the chance that a small local model mishandles simple updates.

Example:

`add 5 sheets 2.0mm mild steel 500 x 500 cost £24.95 each`

can be interpreted directly as an inventory record without asking a language model to invent fields.

The AI is instructed never to invent:

- opportunity scores;
- demand estimates;
- margins;
- machine limits;
- production times;
- product performance;
- future expansion state.

## Market intelligence

MERLIN V4 collects public evidence itself. The default current-stage collectors use:

- public web-search result pages;
- Google News RSS;
- public pages linked from results where retrieval succeeds.

The collector stores source URL, title, publisher, snippet, observed date and any price that can be read from the public page. The local model then interprets that stored evidence into factual observations, reasons it may matter to the current business, unknowns and a possible validation test.

Raw evidence remains visible even if the local model is offline or fails to return valid JSON.

Default scans run every 12 hours while MERLIN is running. `ENABLE_MERLIN_STARTUP.bat` is provided if you want the watcher running whenever the PC is on.

The collector is intentionally rate-limited. It does not contain account-login automation, CAPTCHA bypassing or aggressive anti-bot evasion.

## DXF system

DXF upload still creates:

- immutable internal product ID;
- human MER product code;
- revision record;
- SHA-256 file hash;
- stored master DXF;
- geometry-derived SVG preview;
- dimension/entity/open-path analysis;
- product folder and JSON snapshot.

Unknown DXF units stay unknown until confirmed. MERLIN does not silently interpret arbitrary drawing units as millimetres.

Arbitrary image-to-production-DXF conversion remains disabled. MERLIN will not pretend that a general image can automatically be converted to a safe plasma-ready design until a deterministic topology/bridge/feature validation pipeline is proven on the real machine.

## Data

Default paths:

- database: `data/merlin.sqlite`
- DXF uploads: `data/uploads/`
- product records: `data/products/`
- previews: `data/previews/`

These paths are ignored by Git where appropriate. Back up the `data` directory separately; it is the live business state.

## Commands

```
npm install
npm run seed
npm run check
npm test
npm start
```

Windows convenience:

```
SETUP_MERLIN.bat
START_MERLIN.bat
ENABLE_MERLIN_STARTUP.bat
```

## Render / remote deployment

Render can still run the non-AI MERLIN backend if desired, but V4 is intentionally local-first. A Render instance cannot reach the private model at `127.0.0.1` on your home PC. Do not expect the local AI badge to be online on Render unless you intentionally deploy a separate model server, which is outside the current-stage architecture.

## Migration from V3

V4 migrations are additive. Existing V1/V2/V3 SQLite data can be upgraded in place. Do not delete your database simply to install V4.

New V4 tables add chat threads/messages, market scan evidence, market source configuration, durable business events and knowledge documents.
