# MERLIN CNC V3

MERLIN is the operating system for the CNC plasma business that exists **now**. V3 is an operations-first rebuild of V2 based on the first live-use review.

## V3 changes

- No separate operational tabs: the main dashboard contains the core working areas at once.
- Ask MERLIN is permanently visible as a dashboard card.
- Open orders, production queue, raw material, supplies, finished stock, products/DXF upload, market intelligence, finance and activity are all present on the home screen.
- Dashboard cards can be dragged into any order. Their order is stored in MERLIN's database, not just the browser.
- Each card can switch between normal and wide layout using its ↔ control.
- AI chat has read access to structured orders, inventory, products, market evidence and recent activity in addition to controlled write tools.
- AI chat can use OpenAI live web search for current questions.
- Market research runs automatically on the backend when configured. It stores sourced observations and never generates opportunity scores.
- Market research uses current business capabilities only. Future expansion is not pre-populated.
- Existing V1/V2 SQLite data is migrated in place.
- Existing DXF conservative validation rules remain. Image-to-production-DXF is still deliberately disabled until a demonstrably reliable pipeline exists.

## IMPORTANT: why AI may currently say OFFLINE

The code cannot contain your private OpenAI API key. `OPENAI_API_KEY` must be set on the Render backend.

Without it:

- inventory, orders, products, DXF ingestion, production and finance still work;
- Ask MERLIN cannot call the OpenAI API;
- automatic live market research cannot run.

With it, the backend uses:

- `gpt-5.6-terra` for routine Ask MERLIN conversations by default;
- `gpt-5.6-sol` for deeper automated market research by default.

Both can be changed with environment variables.

## Replace V2 in GitHub Desktop

1. Make sure GitHub Desktop is on `main`.
2. Keep your already-created `legacy-v25` branch untouched.
3. Extract the **GitHub-root V3 ZIP**.
4. Copy everything inside it into the local `summit-money-engine` repository folder.
5. Choose **Replace files in destination**.
6. GitHub Desktop should show changed files.
7. Commit as `MERLIN CNC V3 live dashboard rebuild`.
8. Push origin.
9. Render should redeploy automatically.

Do not delete your Render persistent disk. The SQLite database and uploaded product files belong there.

## Render variables

Required for AI/research:

```text
OPENAI_API_KEY=your private API key
OPENAI_CHAT_MODEL=gpt-5.6-terra
OPENAI_RESEARCH_MODEL=gpt-5.6-sol
MERLIN_AUTO_RESEARCH=true
MERLIN_RESEARCH_INTERVAL_HOURS=12
```

Existing persistent paths should remain:

```text
MERLIN_DB_PATH=/var/data/merlin.sqlite
MERLIN_UPLOAD_DIR=/var/data/uploads
MERLIN_PRODUCT_DIR=/var/data/products
MERLIN_PREVIEW_DIR=/var/data/previews
```

Never put `OPENAI_API_KEY` in `public/config.js`, GitHub Pages JavaScript or a committed `.env` file.

## Market research behaviour

When `OPENAI_API_KEY` exists, MERLIN checks whether its stored research is stale. By default it runs a new evidence cycle every 12 hours. It asks for current product, pricing, supplier, demand and emerging revenue information relevant to the active CNC setup.

MERLIN is explicitly prohibited from generating:

- opportunity scores;
- confidence percentages;
- fabricated sales volumes;
- fabricated demand numbers;
- guessed machine rules;
- unsupported market claims.

It stores the observation, why it may matter, unknowns, a small validation action and the actual sources used.

## Dashboard layout memory

Drag a card by the `⋮⋮` handle. MERLIN saves the card order to the SQLite `ui_preferences` table. The `↔` control switches a card between normal and wide width and is also saved.

## DXF workflow

Upload a DXF directly in the Products & DXFs card. MERLIN creates the permanent product ID and revision, stores the original, analyses the actual vector geometry and generates a preview from that geometry. If DXF physical units are unknown, MERLIN does not silently assume millimetres.

## Run locally

```powershell
Copy-Item .env.example .env
npm install
npm run seed
npm start
```

Open `http://localhost:3000`.

## Verification

Run:

```powershell
npm run check
npm test
```
