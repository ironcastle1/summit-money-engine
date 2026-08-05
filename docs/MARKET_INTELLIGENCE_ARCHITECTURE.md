# Market Intelligence Architecture

The platform is divided into normalization, analysis, fusion, decision-support and presentation layers.

1. Quote and candle normalizers convert connector-specific records into stable internal structures.
2. Technical models calculate returns, moving averages, momentum, trend, realized volatility, ATR, drawdowns and liquidity.
3. Cross-asset models calculate breadth, correlations, relative strength, heatmaps and the current market regime.
4. Commodity models calculate balance, inventory pressure and disruption severity.
5. Event and prediction linkers map evidence to assets using explicit rules, semantic overlap and trade exposure.
6. Evidence, risk and opportunity models expose their components instead of returning unexplained ranks.
7. The platform service enforces bounded concurrency, connector deadlines, short snapshot caching and unavailable-source reporting.
8. Screen, watchlist, portfolio, scenario, sensitivity and export services expose decision-support functions through versioned APIs.
9. The browser controller enhances the existing Markets workspace; it does not create a duplicate navigation section.
