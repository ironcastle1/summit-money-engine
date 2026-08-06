# Merlin V24.1 — Priority Regional Intelligence and Commercial Opportunities

Merlin is a customer-facing intelligence product built around three practical questions:

1. What materially changed in the last 6–24 hours?
2. Where is it happening, and which countries, ports, routes or industries are exposed?
3. What commercial research lead or market implication follows from it?

V24.1 keeps the entire world map and the full underlying repository, while concentrating deeper monitoring and product detail on:

- Middle East
- Europe
- Russia
- Major Asian economies
- North Africa
- United States

All other countries remain searchable, labelled and available on the map. The regional selector changes the depth and ranking of current intelligence; it does not remove the rest of the world.

## Customer product

The visible application contains only:

- **Live map** — current events, current reporting, priority countries, strategic watch areas, major ports and optional shipping routes.
- **Opportunities** — ranked commercial research leads with likely customers, immediate actions and invalidation checks.
- **Markets** — current public market data and notable movers.
- **Conflicts** — current conflict reporting plus clearly labelled reference watch areas when no current report meets the selected window.
- **Countries** — detailed profiles for priority countries and current activity elsewhere.
- **Daily briefing** — a region-filtered summary of current changes, commercial angles, route exposure and research priorities.
- **Saved items** — a browser-stored customer watchlist.

Internal account, billing, source, security and operational services remain in the repository for running the commercial product, but they are not shown as customer navigation.

## V24.1 regional coverage

- Six explicit priority-region catalogues with countries, industries, corridors and monitoring topics.
- Eight map filters: Priority Overview, each of the six priority regions, and World.
- Fifteen strategic watch areas including Suez, Hormuz, the Red Sea, the Black Sea, the Baltic, the Taiwan Strait, Malacca and the US Gulf Coast.
- Region-specific GDELT queries, BBC regional feeds and Google News regional searches.
- Current articles and opportunities carry explicit regional attribution.
- Priority countries remain clickable even when external current-data sources are temporarily unavailable.
- All country and city reference labels remain in the map dataset.
- English place names appear first; local names appear beneath them at closer zoom levels.

## Current-first data rules

- Customer windows are 6, 12 or 24 hours.
- Earthquake news is removed from the customer product.
- Old fallback news is not used to make the product appear populated.
- Current external requests run concurrently with hard deadlines.
- The map and static reference coverage open before optional feeds complete.
- Source states remain explicit when a public upstream is unavailable.

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

For the existing Render service:

```text
PUBLIC_ORIGIN=https://summit-money-engine-1.onrender.com
```

## Verification

```bash
npm test
python scripts/browser-e2e-v24.py
npm run security:scan
npm run verify:imports
```

## Replacing the GitHub repository with GitHub Desktop

1. Clone `ironcastle1/summit-money-engine` in GitHub Desktop.
2. Open the cloned repository folder in Explorer.
3. Keep the hidden `.git` directory.
4. Delete the other repository contents.
5. Extract the complete Merlin V24.1 ZIP and copy everything inside into the cloned repository folder.
6. Commit the replacement and push `main`.
7. Render will deploy the complete repository as one commit.
