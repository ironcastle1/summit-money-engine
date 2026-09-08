# Store Connections

## CSV first
CSV import is intentionally the default because it requires no OAuth plumbing and is easy to audit. MERLIN looks for common column names and maps recognised workshop IDs such as `JOK-001` from SKU/title fields.

Every imported marketplace transaction receives a `(platform, external_id)` uniqueness constraint so repeated CSV imports do not duplicate the same transaction.

## Etsy API
Optional environment values:
- ETSY_KEYSTRING
- ETSY_SHARED_SECRET
- ETSY_SHOP_ID
- ETSY_ACCESS_TOKEN

The V7 sync reader uses Etsy Open API v3 shop transactions. A proper long-lived OAuth setup can be added later; V7 deliberately accepts an owner-provided access token rather than pretending OAuth is zero-configuration.

## eBay API
Optional:
- EBAY_ACCESS_TOKEN
- EBAY_MARKETPLACE_ID (default EBAY_GB)

The sync reader uses the eBay Sell Fulfillment orders feed and maps line-item SKU/title to MERLIN workshop codes.

## Advertising
V7 stores generic daily ad metrics: spend, impressions, clicks, attributed orders and attributed revenue. This already supports cross-channel ROAS/CTR comparisons. Platform-specific automated ad-report connectors can be added once the relevant marketplace credentials/report scopes are actually configured.
