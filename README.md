# MERLIN CNC V7 — Growth Operating System

MERLIN V7 keeps the V6 product/DXF, inventory, completed-sales, finance and deterministic-input core, then adds the systems intended to help the business **find revenue rather than merely record it**.

There is still no chatbot, no OpenAI API and no paid language-model dependency. `Tell MERLIN` remains deterministic: parse → show fields → owner confirms → write.

## V7 in one page

### Products / DXFs
- Short workshop IDs such as `JOK-001`.
- Every uploaded DXF becomes one permanent product line.
- Bulk DXF upload, revision history, actual geometry preview and deterministic checks.
- `Analyse selected` / `Analyse all DXFs`.
- Product-level material, target size, selling price, measured production times and sales performance.
- `Fit proportionally to current table` calculates a safe proportional production target from the actual active machine envelope. It **does not alter the source DXF**; use the calculated scale in Fusion/CAD before cutting.

### Dashboard layout editor
Dragging is no longer required. Press **Edit layout** and each section has:
- Top
- Up
- Down
- Bottom
- Half / Full width
- Visible / hidden

The saved layout lives in SQLite and survives refresh/redeploy when the database is persistent.

### Global Market Radar
V7 seeds a rotating research matrix across 50 country/market groups spanning the UK and Ireland, North and South America, Europe, the Gulf/Middle East, Africa, South Asia, East Asia, Southeast Asia and Oceania. The matrix is intentionally broad while each individual scan remains rate-limited and rotating.

Product families include:
- house numbers/address plaques;
- custom business signs/logo panels;
- personalised names/monograms;
- wall art;
- garden products;
- hospitality signage;
- wedding products;
- functional/decorative steel products.

MERLIN rotates through the source matrix instead of hammering every public source at once. Manual scans can filter by region/category or use a specific focus. `Deep scan` expands the number of queries for that run.

The radar reports:
- number of current public results collected;
- distinct source domains;
- parseable observed prices and original currencies when found;
- recent dated evidence where available;
- cited examples;
- why the category may matter to the current table;
- explicit unknowns;
- a suggested validation action.

It does **not** create opportunity scores or claim that search presence equals sales.

### Business Outreach
The outreach system is owner-controlled prospecting, not an automatic spam sender.

A scan takes:
- location/postcode;
- radius;
- business category;
- country;
- enrichment limit.

The scanner uses public OpenStreetMap data through Nominatim/Overpass to find businesses geographically. When websites are available, MERLIN can retrieve public contact pages and extract contact emails/phones. If no website is present it can use public web-search evidence to find a plausible official site when the name match is sufficiently strong.

For UK prospects, optional Companies House enrichment can confirm corporate entities when `COMPANIES_HOUSE_API_KEY` is configured. If MERLIN cannot establish the legal form it leaves the prospect as **Review before email** rather than assuming cold-email permission.

Each prospect stores:
- business name/type;
- location and distance;
- website;
- email and whether the address looks generic/named;
- phone;
- company number/legal form when verified;
- compliance status;
- contact status;
- outreach history.

The prospect dialog creates a deterministic custom-business-sign pitch with buttons to copy it, open a mailto draft and record contacted/replied/quoted/won/lost/do-not-contact states. MERLIN never sends the message automatically.

A daily metric tracks progress against a default **50 contacted businesses/day** target.

### Etsy / eBay / direct sales
V7 has two integration levels:

1. **CSV import — works immediately**
   - Etsy CSV
   - eBay CSV
   - flexible header normalisation
   - duplicate external transaction detection
   - automatic product mapping when a MERLIN product code appears in SKU/title
   - unmatched transactions remain visible in the central sales ledger rather than being discarded.

2. **Optional direct API sync**
   - Etsy sync activates when `ETSY_KEYSTRING`, `ETSY_SHARED_SECRET`, `ETSY_SHOP_ID` and `ETSY_ACCESS_TOKEN` are configured.
   - eBay sync activates when `EBAY_ACCESS_TOKEN` is configured.
   - credentials are intentionally **not** included in source control.

CSV import remains the simpler fallback if API credentials/OAuth are not worth the setup yet.

### Performance graphs
V7 adds native browser charts (no charting dependency):
- revenue over time;
- revenue by channel;
- product performance table;
- advertising spend / attributed revenue / ROAS / CTR summaries.

Ad data can be recorded manually now and can later be expanded with marketplace-specific reporting imports.

### Inventory
One switchable ledger:
- All
- Metal
- Consumables
- Hardware
- Packaging
- Finished
- Offcuts
- Other

### Tell MERLIN
Still deterministic, not conversational AI. It accepts concrete business facts such as purchases, completed sales, production timings, stocktakes, prices, expenses and notes.

## Upgrade from V6
1. Extract the V7 GitHub-root ZIP.
2. Copy its **contents** into the root of the existing `summit-money-engine` repository.
3. Replace matching files.
4. Do **not** delete your persistent `merlin.sqlite` database or Render disk.
5. Commit, for example: `MERLIN CNC V7 growth systems`.
6. Push `main` and allow Render to redeploy.

V7 migrates the existing database in place and adds the prospecting, store, advertising and market-dimension tables/columns.

## Important Render persistence
For real use, continue to use a persistent disk for:
- SQLite database;
- product folders;
- DXFs;
- previews;
- uploaded product assets.

The included `render.yaml` expects `/var/data`.

## Optional environment variables
See `.env.example`. No third-party key is required for the basic MERLIN business system, DXF tools, CSV store import, deterministic intake or most market research.

Optional keys unlock:
- Companies House verification;
- direct Etsy API sync;
- direct eBay API sync.

## Public-data etiquette
The outreach and research subsystems deliberately use rate-limited requests and do not auto-send email. Public services can rate-limit or change. For high-volume commercial prospecting, eventually move discovery/enrichment onto a dedicated licensed provider rather than abusing free community infrastructure.

## Safety / evidence policy
MERLIN must:
- never invent a sales figure, conversion rate or confidence score;
- keep unknowns unknown;
- distinguish collected evidence from inference;
- never label a DXF production-ready merely because it renders;
- never auto-email prospects;
- preserve a do-not-contact state;
- avoid assuming future machinery/capability before the owner actually adds it.
