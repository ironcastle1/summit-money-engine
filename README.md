# Summit Money Engine Part 9

Map-first build focused on live event/safety overlays, blue map styling, official X API support, and route layers off by default.

## Deploy

Build command:

```bash
npm install --package-lock=false --no-audit --no-fund
```

Start command:

```bash
npm start
```

Health check:

```text
SUMMIT-MONEY-ENGINE-PART9-BLUE-RISK-X-ROUTES
```

## Optional live X

Add this in Render Environment:

```text
X_BEARER_TOKEN=your_official_x_api_bearer_token
```

The app will not fake X data without the key.
