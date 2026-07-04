# Summit Money Engine Part 8

Map-first safety and money intelligence build.

Health check should return:

```
SUMMIT-MONEY-ENGINE-PART8-SAFETY-WAR-ROUTES-TABS
```

## Upload
Upload the folder contents into the existing `summit-money-engine` repo. Do not upload `node_modules` or `package-lock.json`.

## Render
Build Command:

```
npm install --package-lock=false --no-audit --no-fund
```

Start Command:

```
npm start
```

## Optional live data keys

```
X_BEARER_TOKEN=your_official_x_api_bearer_token
```

Without that, the X tab will correctly say the feed is not connected. It will not fake scraped X data.

## Part 8 changes

- Removes bottom scrolling tape. The top ticker stays.
- Adds top-menu tabs: Markets, Crypto, Commodities, Polymarket, X Live, War, Safety, Routes, Rapid Movers.
- Merges sea and land route controls into one Routes tab.
- Replaces Tech with AI.
- Uses darker blue-only map treatment. Dots remain multicoloured.
- Opens information in a right-side panel, not map popups.
- Clicking an active tab closes it; opening another tab closes any current panel.
- Adds source-backed event dots from GDELT/ReliefWeb/X API when available.
- Adds UK local crime lookup through data.police.uk only where available.
- Adds safety light logic based on nearby verified events and UK crime feed.
- Adds rapid mover projection charts with labelled axes.
- Keeps war/terror dots for current feed and highlights war-pressure clusters without inventing battlelines or territory control.
