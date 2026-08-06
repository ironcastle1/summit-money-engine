# Merlin V23 — Current Events and Commercial Opportunities

Merlin is a customer-facing world-events product built around three practical questions:

1. What has changed in the last 24 hours?
2. Where is it happening and what can I click to inspect?
3. What commercial research lead or market implication follows from it?

V23 replaces the previous internal-operations interface with a fast, simple product intended for paying users.

## Customer product

The visible application contains only:

- **Live map** — current events, current news, major ports and optional shipping routes.
- **Opportunities** — ranked commercial research leads with beneficiaries, potential customers, immediate actions and verification steps.
- **Markets** — current public market data and notable movers.
- **Conflicts** — current conflict-related reporting from the selected time window.
- **Countries** — current activity grouped by country.
- **Daily briefing** — a concise summary of current events, opportunities and markets.
- **Saved items** — a browser-stored customer watchlist.

Internal account, billing, source, security and operational services remain available to the application, but they are not presented as customer navigation.

## V23 corrections

- Removed earthquake news, earthquake map layers and USGS earthquake ingestion from the customer product.
- Default data window is 24 hours; the maximum customer window is 48 hours.
- Old fallback news and events are not used to make the application appear populated.
- Map markers and labels render correctly through the shared viewport state.
- Place labels are English first; local names appear second only when useful at closer zoom levels.
- Static country, city, port and route catalogues are served from `public/data` immediately.
- Map tiles load directly from CARTO rather than waiting for a Render tile proxy.
- Existing tiles remain visible while the next zoom level loads.
- Touchpad and mouse-wheel zoom are throttled and substantially less aggressive.
- The Merlin logo is inline SVG and cannot fail as a missing image asset.
- Detail panels, feeds and workspaces have visible independent scrollbars.
- Theme/colour switching and customer-facing administration clutter were removed.
- Current-data APIs load concurrently with hard browser deadlines; the map itself does not wait for them.

## Runtime

Requirements:

- Node.js 20 or newer
- A writable `runtime-data` directory

Development:

```bash
cp .env.example .env
npm start
```

Open `http://localhost:4173`.

Production minimum:

```text
NODE_ENV=production
PUBLIC_ORIGIN=https://your-real-domain.example
SESSION_SECRET=<at-least-32-random-characters>
SECURE_COOKIES=true
```

For the existing Render service, use:

```text
PUBLIC_ORIGIN=https://summit-money-engine-1.onrender.com
```

## Verification

```bash
npm test
npm run test:v23
npm run browser:v23
npm run security:scan
npm run verify:imports
```

The release was verified with the complete Node test suite, JavaScript syntax checks, an import-graph audit, a secret scan, a production server smoke test and rendered Chromium interaction tests at desktop and mobile sizes.

## Replacing the GitHub repository with GitHub Desktop

1. Clone `ironcastle1/summit-money-engine` in GitHub Desktop.
2. Open the cloned repository folder in Explorer.
3. Keep the hidden `.git` directory.
4. Delete the other repository contents.
5. Extract the complete Merlin V23 ZIP and copy everything inside into the cloned repository folder.
6. In GitHub Desktop, commit the replacement and push `main`.
7. Render will deploy the complete repository as one commit.
