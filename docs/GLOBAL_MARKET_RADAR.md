# Global Market Radar

The radar is a rotating evidence collector, not a demand-prediction model.

## Why rotating
Hundreds of market/category combinations exist. Querying all of them and opening every result every few hours would be slow and abusive to public sources. MERLIN therefore stores a large source matrix but scans a controlled slice each run. The rotation cursor is persisted in `meta.market_rotation_index`.

Defaults:
- 30 configured queries per normal scan;
- up to 120 in a deep scan;
- up to 8 search results per query;
- only 2 result pages enriched per query by default.

These can be changed with environment variables.

## Evidence
Raw collected items store region/category fields. Evidence summaries preserve:
- distinct domain count;
- parsed price evidence and currency;
- publication recency where available;
- source links;
- unknowns.

There are no numerical opportunity scores.
